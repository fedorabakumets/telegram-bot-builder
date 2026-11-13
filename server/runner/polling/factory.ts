/** @fileoverview Рабочие адаптеры диспетчера: Redis, Telegram и лениво создаваемые обработчики Python. */
import Redis from "ioredis";
import { dirname, join } from "node:path";
import type { RunnerConfig } from "../runnerConfig";
import { NodePollingDispatcher } from "./dispatcher";
import type { PollingBot } from "./dispatcherTypes";
import { DemandQueue } from "./queue";
import { withPollingLease } from "./lease";
import { runPollingReceiver } from "./receiver";
import { requestUpdates } from "./transport";
import { startPythonPollingChild, type PythonPollingChild } from "./pythonChild";
import { telegramPollingId } from "./runtimeSettings";
import { ChildMemoryLedger } from "./memoryLedger";
import { PollingTiming } from "./timing";
import { SharedPollingHost } from "./sharedHost";
import { WebhookIngress } from "./webhookIngress";
/** Реальный диспетчер группы без постоянного Python-процесса. */
export class ProcessPollingRuntime {
  /** Соединения для каждого явно настроенного хранилища бота. */
  private readonly clients = new Map<string, Promise<Redis>>();
  /** Реальные временные процессы, включая PID интерпретатора под оболочкой ОС. */
  private readonly children = new Map<number, PythonPollingChild>();
  /** Измерения только живых обработчиков без постоянного Python-диспетчера. */
  private readonly memory: ChildMemoryLedger;
  /** Лёгкие замеры этапов без профилировщика и пользовательских данных. */
  private readonly timing = new PollingTiming();
  /** Общий интерпретатор, запускаемый только при появлении обновлений. */
  private readonly shared?: SharedPollingHost;
  /** Приостановка вывода до освобождения очереди событий панели. */
  private paused = false;
  /** Единственная операция окончательной остановки, общая для kill и shutdown. */
  private stopping?: Promise<void>;
  /** Диспетчер регистраций и пробуждений. */
  readonly dispatcher: NodePollingDispatcher;
  /** Входящие webhook сохраняются тем же диспетчером без фонового polling. */
  readonly webhook = new WebhookIngress(bot => this.client(bot), tokenId => this.dispatcher.wake(tokenId));

  /** @param config - Пути исполнителя. @param emit - Передача очищенных строк панели. */
  constructor(private readonly config: RunnerConfig, private readonly emit: (line: string) => void, maximum = 0, sharedHost?: SharedPollingHost) {
    this.memory = new ChildMemoryLedger(memoryKb => this.emit(JSON.stringify({
      type: "system", content: `memory_kb:${memoryKb + (this.shared?.counters().memoryKb ?? 0)}`,
    })));
    if (config.processHandler !== "isolated") this.shared = sharedHost ?? new SharedPollingHost(config, event => {
      if (Number.isSafeInteger(event.token_id)) this.timing.handled(Number(event.token_id), event);
      if (event.type === "stdout" || event.type === "stderr") this.emit(JSON.stringify(event));
    }, memoryKb => this.emit(JSON.stringify({ type: "system", content: `memory_kb:${memoryKb + this.memory.total()}` })));
    if (sharedHost) sharedHost.processObserver = event => {
      if (Number.isSafeInteger(event.token_id)) this.timing.handled(Number(event.token_id), event);
    };
    this.dispatcher = new NodePollingDispatcher({
      hasPending: async (bot) => new DemandQueue(await this.client(bot), telegramPollingId(bot.token)).hasPending(),
      receive: async (bot, signal, wake, ready) => {
        if (bot.webhook) return this.webhook.receive(bot, signal, ready, () => this.dispatcher.quiesceChild(bot.tokenId));
        const client = await this.client(bot);
        await withPollingLease(client, bot.token, signal, async (owned) => {
          ready();
          await runPollingReceiver(this.timing.receiver(bot.tokenId, { token: bot.token, signal: owned,
            queue: new DemandQueue(client, telegramPollingId(bot.token)), onUpdates: async () => { wake(); },
            request: (token, payload, abort) => requestUpdates(token, payload, abort, bot.env.TELEGRAM_BOT_API_URL) }));
        }, () => this.dispatcher.quiesceChild(bot.tokenId));
      },
      startChild: (bot, signal) => this.startChild(bot, signal),
      lifecycle: (bot, state) => this.emit(JSON.stringify({ type: "system", content:
        state === "started" ? `bot_started:${bot.tokenId}` : state === "stopped"
          ? `bot_stopped:${bot.tokenId}` : `bot_exited:${bot.tokenId}:error` })),
    }, this.shared ? { kind: "unlimited" } : maximum);
  }

  /** Подключается без бесконечной автономной очереди и скрывает адрес при ошибке. */
  private client(bot: PollingBot): Promise<Redis> {
    const url = bot.env.REDIS_URL;
    let pending = this.clients.get(url);
    if (!pending) {
      const client = new Redis(url, { lazyConnect: true, enableOfflineQueue: false,
        maxRetriesPerRequest: 1, commandTimeout: 5_000, connectTimeout: 5_000 });
      client.on("error", () => {});
      pending = client.connect().then(() => client).catch(() => {
        client.disconnect(); this.clients.delete(url);
        throw new Error("Хранилище обновлений недоступно");
      });
      this.clients.set(url, pending);
    }
    return pending;
  }

  /** Создаёт обработчик с секретами в stdin и отфильтрованным жизненным циклом. */
  private async startChild(bot: PollingBot, signal: AbortSignal): Promise<PythonPollingChild> {
    const memory = this.memory.register(bot.tokenId);
    const started = Date.now();
    this.timing.record(bot.tokenId, "child_start");
    try {
      const child = this.shared ? await this.shared.start(bot, signal) : await startPythonPollingChild({ command: this.config.pythonPath,
        args: ["-u", join(dirname(this.config.workerScript), "process_child_guard.py")], env: process.env,
        init: { token_id: bot.tokenId, token: bot.token, bot_file: bot.botFile,
          env: bot.env, project_id: bot.projectId, idle: bot.idleTimeout }, signal,
        onEvent: (event) => {
          this.timing.handled(bot.tokenId, event);
          if (event.type === "process" && event.event === "memory") memory.record(event.memory_kb);
          if (event.type === "stdout" || event.type === "stderr") this.emit(JSON.stringify(event));
        },
        onLog: (content) => this.emit(JSON.stringify({ type: "stderr", token_id: bot.tokenId, content })),
      });
      this.children.set(bot.tokenId, child);
      this.timing.record(bot.tokenId, "child_ready", { startupMs: Date.now() - started });
      child.pauseOutput?.(this.paused);
      void child.done.then(() => {
        this.timing.record(bot.tokenId, "child_exit", { lifetimeMs: Date.now() - started });
        memory.close();
        if (this.children.get(bot.tokenId) === child) this.children.delete(bot.tokenId);
      });
      return child;
    } catch (error) {
      this.timing.record(bot.tokenId, "child_start_failed", { startupMs: Date.now() - started });
      memory.close(); throw error;
    }
  }

  /** Передаёт давление очереди событий всем текущим и будущим процессам. */
  pauseOutput(paused: boolean): void {
    this.paused = paused;
    this.shared?.pauseOutput(paused);
    for (const child of this.children.values()) child.pauseOutput?.(paused);
  }

  /** Возвращает реальные PID и агрегаты без токенов и переменных ботов. */
  counters() {
    return { ...this.dispatcher.counters(), handlerMode: this.shared ? "shared" : "isolated",
      hostAlive: this.shared ? Boolean(this.shared.counters().pid) : this.children.size > 0,
      children: [...this.children].map(([tokenId, child]) =>
      ({ tokenId, pid: child.pid, actualPid: child.actualPid })), redisConnections: this.clients.size,
      memoryKb: this.memory.total() + (this.shared?.counters().memoryKb ?? 0), childMemory: this.memory.snapshot(),
      sharedHost: this.shared?.counters() ?? null };
  }

  /** Немедленно отменяет приёмники и принудительно завершает реальные дочерние деревья. */
  kill(): void {
    this.shared?.kill();
    for (const child of this.children.values()) child.kill();
    void this.shutdown().catch(() => {});
  }

  /** Завершает обработчики до отключения их очередей и освобождения lease. */
  shutdown(): Promise<void> {
    return this.stopping ??= (async () => {
      try { await this.dispatcher.shutdown(); await this.shared?.shutdown(); }
      finally { for (const pending of this.clients.values()) void pending.then((client) => client.disconnect()).catch(() => {});
        this.clients.clear(); }
    })();
  }
}
