/** @fileoverview Ожидание окончательной остановки старого обработчика перед передачей токена Node. */
import type { LocalWorkerChannel } from "../bots/localWorkerChannel";
import type { RunnerEvent } from "../redis/workerStreams";

/** Запуски старого Python, которые ещё могут удерживать polling-блокировку. */
export class RunnerLegacyRoutes {
  /** Направленные старому воркеру токены. */
  private readonly tokens = new Set<number>();
  /** Ожидание подтверждения освобождения токена. */
  private readonly waiters = new Map<number, () => void>();

  /** Запоминает запуск до записи команды в stdin. */
  started(tokenId: number): void { this.tokens.add(tokenId); }

  /** Учитывает только окончательные события старого воркера. */
  observe(event: RunnerEvent): boolean {
    if (event.k !== "line" || !event.l) return false;
    try {
      const message = JSON.parse(event.l);
      if (message.type !== "system") return false;
      const match = /^bot_(stopped|exited):(\d+)(?::(.*))?$/.exec(message.content);
      if (!match) return false;
      const tokenId = Number(match[2]), waiting = this.waiters.has(tokenId);
      if (!waiting || match[1] === "stopped") this.tokens.delete(tokenId);
      if (match[1] === "stopped") this.waiters.get(tokenId)?.();
      return waiting && match[3] !== "error";
    } catch { /* Обычный вывод не относится к протоколу остановки. */ }
    return false;
  }

  /** Ожидает подтверждение, исключая перекрытие старого и нового владельцев polling. */
  async stopBeforeHandoff(channel: LocalWorkerChannel | undefined, tokenId: number): Promise<void> {
    if (!channel || !this.tokens.has(tokenId)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopped = new Promise<void>((resolve, reject) => {
      this.waiters.set(tokenId, resolve);
      timer = setTimeout(() => reject(new Error("Старый обработчик не подтвердил остановку")), 10_000);
    });
    try {
      await Promise.all([channel.sendAsync(JSON.stringify({ cmd: "stop_bot", token_id: tokenId })), stopped]);
    } finally { clearTimeout(timer); this.waiters.delete(tokenId); }
  }
}
