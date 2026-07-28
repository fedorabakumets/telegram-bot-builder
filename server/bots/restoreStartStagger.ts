/**
 * @fileoverview Пауза между стартами ботов при restore (анти-stampede Redis)
 * @module server/bots/restoreStartStagger
 */

/** Задержка между последовательными startBot при restore (мс) */
export const RESTORE_START_STAGGER_MS = 250;

/**
 * Ждёт stagger-паузу перед следующим стартом бота.
 * @param ms - Длительность паузы в миллисекундах
 * @returns Промис, резолвящийся после паузы
 */
export function waitRestoreStagger(ms: number = RESTORE_START_STAGGER_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
