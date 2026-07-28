/**
 * @fileoverview Классификация статуса выхода бота из worker pool
 * @module server/bots/isWorkerCleanExit
 */

/**
 * Считает выход бота «чистой остановкой» (не ошибкой).
 * Включает `running` — совместимость со старыми bot.py, глотавшими CancelledError.
 * @param exitStatus - Статус из worker (`stopped` / `error` / `running` / код)
 * @returns true если это clean stop
 */
export function isWorkerCleanExit(exitStatus: string | number): boolean {
  const statusStr = String(exitStatus);
  return (
    statusStr === 'stopped'
    || statusStr === '0'
    || statusStr === 'null'
    || statusStr === 'running'
  );
}
