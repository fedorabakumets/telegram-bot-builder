/**
 * @fileoverview Константы пауз при рестарте ботов (Telegram getUpdates Conflict)
 * @module server/bots/restartTiming
 */

/** Пауза после подтверждённого graceful stop перед start (мс) */
export const POST_STOP_COOLDOWN_MS = 5_000;

/** Пауза если stop не подтверждён / orphan (мс) */
export const POST_STOP_UNCONFIRMED_COOLDOWN_MS = 5_000;

/** Одна пауза после stop всех токенов в restart-all (мс) */
export const RESTART_ALL_BATCH_COOLDOWN_MS = 5_000;

/** Задержка между start соседних токенов в restart-all (мс) */
export const START_STAGGER_MS = 250;

/**
 * Ждёт указанное число миллисекунд.
 * @param ms - Длительность паузы
 */
export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
