/**
 * @fileoverview Флаг graceful shutdown сервера.
 * Пока true — bot-exited не должен триггерить autoRestart (деплой / SIGTERM).
 * @module server/bots/serverShutdownState
 */

let shuttingDown = false;

/**
 * Включить режим shutdown (вызывать в начале shutdownAllBots).
 */
export function markServerShuttingDown(): void {
  shuttingDown = true;
}

/**
 * Сервер сейчас гасится?
 * @returns true во время graceful shutdown
 */
export function isServerShuttingDown(): boolean {
  return shuttingDown;
}

/**
 * Сбросить флаг (только для тестов).
 */
export function resetServerShutdownState(): void {
  shuttingDown = false;
}
