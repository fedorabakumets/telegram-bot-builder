/** @fileoverview Ограниченные замеры доставки, очереди и пробуждения без содержимого сообщений. */
import type { PollingReceiverOptions, PollUpdate } from "./receiver";
import { requestUpdates } from "./transport";
import { observePollingTiming } from "./timingMetrics";

/** Временные отметки одного обновления без пользовательских данных. */
interface UpdateTiming {
  /** Номер бота в базе. */
  tokenId: number;
  /** Момент получения HTTP-ответа. */
  receivedAt: number;
  /** Момент сохранения в Redis. */
  persistedAt?: number;
}

/** Пишет отдельные числовые события; хранит не больше 1024 ожидающих обновлений. */
export class PollingTiming {
  /** Ограниченный реестр корреляции по боту и обновлению. */
  private readonly updates = new Map<string, UpdateTiming>();

  /** @param write - Получатель безопасных событий. @param now - Часы для замеров и адресных тестов. */
  constructor(private readonly write: (event: object) => void = event => console.log(JSON.stringify(event)),
    private readonly now = Date.now) {}

  /** Записывает только заданные вызывающей стороной числовые поля и название этапа. */
  record(tokenId: number, stage: string, values: Record<string, number> = {}): void {
    observePollingTiming(stage, values, this.now());
    this.write({ type: "polling_timing", at: new Date(this.now()).toISOString(), tokenId, stage, ...values });
  }

  /** Оборачивает транспорт и очередь, сохраняя поведение повторов и подтверждений. */
  receiver(tokenId: number, options: PollingReceiverOptions): PollingReceiverOptions {
    const request = options.request ?? requestUpdates;
    return { ...options, request: async (...args) => {
      const started = this.now();
      try {
        const result = await request(...args);
        const receivedAt = this.now();
        const updates = result.body.ok === true && Array.isArray(result.body.result) ? result.body.result as PollUpdate[] : [];
        for (const update of updates) {
          this.updates.set(`${tokenId}:${update.update_id}`, { tokenId, receivedAt });
          while (this.updates.size > 1024) this.updates.delete(this.updates.keys().next().value!);
          const date = (update.message as { date?: number } | undefined)?.date;
          this.record(tokenId, "received", { updateId: update.update_id, requestMs: receivedAt - started,
            ...(Number.isFinite(date) ? { telegramAgeMs: receivedAt - Number(date) * 1000 } : {}) });
        }
        if (result.body.ok !== true) this.record(tokenId, "telegram_rejected", { code: Number(result.body.error_code ?? result.status) });
        return result;
      } catch (error) {
        if (!options.signal.aborted) this.record(tokenId, "request_failed", { requestMs: this.now() - started });
        throw error;
      }
    }, queue: { offset: () => options.queue.offset(), enqueue: async updates => {
      const started = this.now();
      try { await options.queue.enqueue(updates); }
      catch (error) { this.record(tokenId, "persist_failed", { persistMs: this.now() - started }); throw error; }
      for (const update of updates) {
        const timing = this.updates.get(`${tokenId}:${update.update_id}`);
        if (timing) timing.persistedAt = this.now();
      }
      this.record(tokenId, "persisted", { count: updates.length, persistMs: this.now() - started });
    } } };
  }

  /** Связывает штатную строку aiogram с получением обновления, не сохраняя саму строку. */
  handled(tokenId: number, event: Record<string, unknown>): void {
    if (event.type === "process" && event.event === "startup_timing") {
      const stages = ["python_entered", "imports_begin", "imports_done", "redis_begin", "redis_done",
        "aiogram_begin", "aiogram_done", "siblings_begin", "siblings_done", "bytecode_begin", "bytecode_done",
        "module_begin", "module_done", "state_begin", "state_done", "main_begin", "bot_ready"];
      if (stages.includes(String(event.stage)) && typeof event.stage_ms === "number" && Number.isFinite(event.stage_ms)
        && typeof event.elapsed_ms === "number" && Number.isFinite(event.elapsed_ms))
        this.record(tokenId, `python_${event.stage}`, { stageMs: event.stage_ms, elapsedMs: event.elapsed_ms });
      return;
    }
    if (event.type !== "stdout" && event.type !== "stderr") return;
    const match = String(event.content ?? "").match(/Update id=(\d+) is handled\. Duration (\d+) ms/);
    if (!match) return;
    const key = `${tokenId}:${match[1]}`, timing = this.updates.get(key);
    if (!timing) return;
    this.record(tokenId, "handled", { updateId: Number(match[1]), handlerMs: Number(match[2]),
      receiveToHandledMs: this.now() - timing.receivedAt,
      ...(timing.persistedAt === undefined ? {} : { persistedToHandledMs: this.now() - timing.persistedAt }) });
    this.updates.delete(key);
  }
}
