/** @fileoverview Учёт постоянных сценариев и ожидание освобождения токена общего Python. */
export class PermanentActivations {
  /** Постоянные сценарии, включая ожидающие запуска. */
  readonly tokens = new Set<number>();
  /** Ожидания окончательной остановки. */
  private readonly waiters = new Map<number, () => void>();
  /** Учитывает остановку, не принимая обычные строки за протокол. */
  observe(event: Record<string, unknown>): void {
    if (event.type !== "system" || typeof event.content !== "string") return;
    const match = /^bot_(?:stopped|exited):(\d+)(?::.*)?$/.exec(event.content);
    if (!match) return;
    const id = Number(match[1]); this.tokens.delete(id); this.waiters.get(id)?.();
  }
  /** Останавливает владельца до регистрации нового получателя обновлений. */
  async stop(tokenId: number, send: (command: Record<string, unknown>) => Promise<void>): Promise<void> {
    if (!this.tokens.has(tokenId)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = new Promise<void>((resolve, reject) => {
      this.waiters.set(tokenId, resolve);
      timer = setTimeout(() => reject(new Error("Общий обработчик не подтвердил остановку")), 10_000);
    });
    try { await Promise.all([send({ cmd: "stop_bot", token_id: tokenId }), done]); }
    finally { clearTimeout(timer); this.waiters.delete(tokenId); }
  }
  /** Сбрасывает принадлежность после окончательного завершения процесса. */
  clear(): void { this.tokens.clear(); for (const resolve of this.waiters.values()) resolve(); this.waiters.clear(); }
}
