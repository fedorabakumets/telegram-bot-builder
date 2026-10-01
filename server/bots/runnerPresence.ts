/**
 * @fileoverview Ожидание, пока удалённый исполнитель начнёт слушать команды.
 * Команды, отправленные до его старта, исполнитель не увидит, поэтому панель
 * сначала шлёт ping и ждёт pong (или hello от только что запущенного исполнителя).
 * @module server/bots/runnerPresence
 */

/** Ожидающий ответа исполнителя */
interface PresenceWaiter {
  /** Завершает ожидание успехом */
  resolve: () => void;
}

/**
 * Отслеживает признаки жизни исполнителя: события hello и pong
 */
export class RunnerPresence {
  /** Ожидающие ответа */
  private readonly waiters = new Set<PresenceWaiter>();

  /** Исполнитель ответил: hello или pong */
  notify(): void {
    for (const waiter of [...this.waiters]) waiter.resolve();
  }

  /**
   * Ждёт ответа исполнителя, повторяя ping
   * @param ping - Отправка ping исполнителю
   * @param timeoutMs - Сколько ждать всего
   * @param pingEveryMs - Как часто повторять ping
   * @returns промис, который завершается при ответе
   * @throws Error, если исполнитель не ответил за timeoutMs
   */
  wait(ping: () => void, timeoutMs: number, pingEveryMs = 3_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const finish = (error?: Error) => {
        clearInterval(timer);
        clearTimeout(deadline);
        this.waiters.delete(waiter);
        if (error) reject(error);
        else resolve();
      };
      const waiter: PresenceWaiter = { resolve: () => finish() };
      this.waiters.add(waiter);
      const timer = setInterval(ping, pingEveryMs);
      const deadline = setTimeout(
        () => finish(new Error(`исполнитель не ответил за ${Math.round(timeoutMs / 1000)} с`)),
        timeoutMs,
      );
      ping();
    });
  }
}
