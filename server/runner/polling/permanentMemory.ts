/** @fileoverview Резерв стартовых пиков постоянных сценариев общего Python-хоста. */
import { isMemoryPressure, type MemoryAdmission, type MemoryReservation } from "./memoryAdmission";

/** Сохраняет резерв до подтверждения готовности либо отказа запуска. */
export class PermanentMemory {
  /** Ещё запускающиеся сценарии. */
  private readonly pending = new Map<number, MemoryReservation>();
  /** Передаёт команду после допуска; ошибка затрагивает только новый запуск. */
  async send(command: Record<string, unknown>, admission: Pick<MemoryAdmission, "acquire">,
    emit: (event: Record<string, unknown>) => void, tokens: Set<number>,
    send: () => Promise<void>, closeIdle: () => void): Promise<void> {
    const tokenId = Number(command.token_id), starting = command.cmd === "start_bot";
    if (starting) { await this.acquire(command, admission, emit); tokens.add(tokenId); }
    try { await send(); }
    catch (error) {
      if (starting) { tokens.delete(tokenId); this.release(tokenId); }
      closeIdle(); throw error;
    }
  }
  /** Проверяет допуск и публикует ожидаемый отказ вместимости. */
  async acquire(command: Record<string, unknown>, admission: Pick<MemoryAdmission, "acquire">,
    emit: (event: Record<string, unknown>) => void): Promise<void> {
    const tokenId = Number(command.token_id);
    try {
      const reservation = await admission.acquire();
      this.release(tokenId); this.pending.set(tokenId, reservation);
    } catch (error) {
      if (isMemoryPressure(error)) {
        const launchId = Number((command.env as Record<string, unknown> | undefined)?.BOT_LAUNCH_ID);
        emit({ type: "bot_runtime_error", token_id: tokenId, code: "memory_pressure", source: "runner_memory",
          ...(Number.isSafeInteger(launchId) && launchId > 0 ? { launch_id: launchId } : {}), diagnostics: error.diagnostics });
      }
      throw error;
    }
  }
  /** Освобождает отказавший или остановленный запуск. */
  release(tokenId: number): void { this.pending.get(tokenId)?.release(); this.pending.delete(tokenId); }
  /** Подтверждение готовности оставляет запас до завершения стартового пика. */
  observe(event: Record<string, unknown>): void {
    if (event.type !== "system") return;
    const lifecycle = /^bot_(started|stopped|exited):(\d+)/.exec(String(event.content));
    if (!lifecycle) return;
    const tokenId = Number(lifecycle[2]);
    if (lifecycle[1] === "started") { this.pending.get(tokenId)?.settled(); this.pending.delete(tokenId); }
    else this.release(tokenId);
  }
  /** Гибель хоста освобождает все незавершённые резервы. */
  clear(): void { for (const id of this.pending.keys()) this.release(id); }
}
