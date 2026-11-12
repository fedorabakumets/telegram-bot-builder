/** @fileoverview Приём обновлений в Node и пробуждение Python по политике вместимости группы. */
import type { DispatchEntry, DispatcherCapacity, DispatcherDependencies, PollingBot } from "./dispatcherTypes";
import { failChildRegistration } from "./dispatcherFailure";
import { LifecycleOperations } from "./lifecycleOperations";
import { dispatcherCounters } from "./dispatcherCounters";
export type { DispatcherCapacity, DispatcherDependencies, PollingBot } from "./dispatcherTypes";
/** Не держит Python в простое и исключает параллельные обработчики одного токена. */
export class NodePollingDispatcher {
  /** Регистрации, включая ожидающие свободного места. */
  private readonly entries = new Map<number, DispatchEntry>();
  /** Число работающих или запускающихся процессов. */
  private active = 0;
  /** Одна проверка очередей одновременно исключает двойное резервирование. */
  private pumping = false;
  /** Команды одного токена выполняются последовательно, исключая потерянные регистрации. */
  private readonly operations = new LifecycleOperations();
  /** @param dependencies - Адаптеры Redis, Telegram и процессов. @param capacity - Предел отдельных процессов либо общий процесс без фиксированного лимита. */
  constructor(private readonly dependencies: DispatcherDependencies, private readonly capacity: DispatcherCapacity = 0) {
    if (typeof capacity === "number" ? !Number.isInteger(capacity) || capacity < 0 : capacity?.kind !== "unlimited")
      throw new Error("Недопустимый предел обработчиков");
  }
  /** Регистрирует бота; приёмник самостоятельно подтверждает готовность после получения блокировки. */
  start(bot: PollingBot): Promise<void> { return this.operations.run(bot.tokenId, () => this.register(bot)); }
  /** Заменяет регистрацию внутри уже упорядоченной команды запуска. */
  private async register(bot: PollingBot): Promise<void> {
    await this.stopEntry(bot.tokenId);
    const entry: DispatchEntry = { bot, abort: new AbortController(), childAbort: new AbortController(),
      quiescing: false, failed: false, pending: true, ready: false };
    this.entries.set(bot.tokenId, entry);
    entry.receiver = Promise.resolve().then(() => this.dependencies.receive(bot, entry.abort.signal,
      () => this.wake(bot.tokenId), () => {
        if (entry.abort.signal.aborted || entry.ready) return;
        entry.ready = true;
        this.dependencies.lifecycle(bot, "started");
        this.wake(bot.tokenId);
      })).then(() => {
        if (!entry.abort.signal.aborted) throw new Error("Приёмник неожиданно завершился");
      }).catch(async () => {
        if (entry.abort.signal.aborted) return;
        entry.failed = true;
        entry.abort.abort();
        if (this.entries.get(bot.tokenId) === entry) this.entries.delete(bot.tokenId);
        if (entry.retry) clearTimeout(entry.retry);
        await this.quiesceChild(bot.tokenId, entry);
        this.dependencies.lifecycle(bot, "error");
      });
  }
  /** Отмечает сохранённое обновление; повторные сигналы объединяются. */
  wake(tokenId: number): void {
    const entry = this.entries.get(tokenId);
    if (!entry || entry.abort.signal.aborted || entry.quiescing) return;
    entry.pending = true;
    void this.pump();
  }
  /** Останавливает регистрацию, не удаляя очередь необработанных обновлений. */
  stop(tokenId: number): Promise<boolean> { return this.operations.run(tokenId, () => this.stopEntry(tokenId)); }
  /** Завершает регистрацию без повторного захвата очереди команд того же токена. */
  private async stopEntry(tokenId: number): Promise<boolean> {
    const entry = this.entries.get(tokenId);
    if (!entry) return false;
    entry.abort.abort();
    if (entry.retry) clearTimeout(entry.retry);
    await this.quiesceChild(tokenId, entry);
    await entry.receiver;
    if (this.entries.get(tokenId) === entry) this.entries.delete(tokenId);
    if (!entry.failed) this.dependencies.lifecycle(entry.bot, "stopped");
    return true;
  }
  /** Завершает приёмники и обработчики до выключения исполнителя. */
  async shutdown(): Promise<void> {
    await Promise.all([...new Set([...this.entries.keys(), ...this.operations.keys()])].map((id) => this.stop(id)));
  }
  /** Завершает только обработчик до снятия polling-блокировки, не ожидая приёмник. */
  async quiesceChild(tokenId: number, knownEntry?: DispatchEntry): Promise<void> {
    const entry = knownEntry ?? this.entries.get(tokenId);
    if (!entry) return;
    entry.quiescing = true;
    entry.pending = false;
    if (entry.retry) clearTimeout(entry.retry);
    entry.childAbort.abort();
    await entry.child?.stop();
    await entry.task;
  }
  /** Возвращает только агрегаты без токенов, переменных и содержимого сообщений. */
  counters() { return dispatcherCounters(this.entries, this.active, this.capacity); }
  /** Резервирует место только после проверки сохранённого обновления. */
  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      for (const entry of [...this.entries.values()]) {
        if (typeof this.capacity === "number" && this.capacity > 0 && this.active >= this.capacity) break;
        if (!entry.ready || !entry.pending || entry.task || entry.retry || entry.quiescing || entry.abort.signal.aborted) continue;
        entry.pending = false;
        let hasPending: boolean;
        try { hasPending = await this.dependencies.hasPending(entry.bot); }
        catch { this.retry(entry); continue; }
        if (entry.abort.signal.aborted || entry.quiescing || !hasPending) continue;
        this.active++;
        entry.task = this.run(entry);
      }
    } finally {
      this.pumping = false;
      if ((typeof this.capacity !== "number" || this.capacity === 0 || this.active < this.capacity) && [...this.entries.values()].some((entry) =>
        entry.ready && entry.pending && !entry.task && !entry.retry && !entry.quiescing && !entry.abort.signal.aborted))
        queueMicrotask(() => { void this.pump(); });
    }
  }
  /** Дожидается выхода процесса, затем повторно проверяет очередь на гонку с завершением. */
  private async run(entry: DispatchEntry): Promise<void> {
    try {
      entry.child = await this.dependencies.startChild(entry.bot, entry.childAbort.signal);
      if (entry.childAbort.signal.aborted) await entry.child.stop();
      const result = await entry.child.done;
      if (result && typeof result === "object" && "code" in result && result.code !== 0)
        throw new Error("Обработчик завершился с ошибкой");
    } catch {
      if (!entry.abort.signal.aborted && !entry.quiescing)
        failChildRegistration(entry, this.dependencies, () => {
          if (this.entries.get(entry.bot.tokenId) === entry) this.entries.delete(entry.bot.tokenId);
        });
    } finally {
      entry.child = undefined;
      entry.task = undefined;
      this.active--;
      if (this.entries.get(entry.bot.tokenId) === entry) {
        this.entries.delete(entry.bot.tokenId);
        this.entries.set(entry.bot.tokenId, entry);
      }
      if (!entry.abort.signal.aborted && !entry.quiescing) entry.pending = true;
      queueMicrotask(() => { void this.pump(); });
    }
  }
  /** Ограничивает частоту повторов при недоступности Redis или сбоях запуска. */
  private retry(entry: DispatchEntry): void {
    if (entry.retry || entry.abort.signal.aborted || entry.quiescing) return;
    entry.pending = true;
    entry.retry = setTimeout(() => {
      entry.retry = undefined;
      this.wake(entry.bot.tokenId);
    }, 1000);
    entry.retry.unref();
  }
}
