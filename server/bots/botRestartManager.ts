/**
 * @fileoverview Менеджер автоперезапуска ботов при краше
 * Хранит счётчики попыток перезапуска и реализует exponential backoff.
 * @module server/bots/botRestartManager
 */

/** Структура счётчика перезапусков для одного токена */
interface RestartCounter {
  /** Количество попыток перезапуска подряд */
  attempts: number;
  /** Время последнего краша (Unix timestamp в мс) */
  lastCrashAt: number;
}

/**
 * Хранилище счётчиков перезапусков
 * Ключ — tokenId, значение — данные о попытках
 */
const restartCounters = new Map<number, RestartCounter>();

/** Задержки между попытками: 5с, 15с, 60с (exponential backoff) */
const RESTART_DELAYS = [5000, 15000, 60000];

/**
 * Если бот проработал дольше этого времени — счётчик сбрасывается
 * Значение: 2 минуты
 */
const STABLE_UPTIME_MS = 2 * 60 * 1000;

/**
 * Сбрасывает счётчик перезапусков для токена.
 * Вызывать, если бот работает стабильно дольше STABLE_UPTIME_MS.
 * @param tokenId - Идентификатор токена бота
 */
export function resetRestartCounter(tokenId: number): void {
  restartCounters.delete(tokenId);
}

/**
 * Возвращает задержку перед следующей попыткой перезапуска.
 * Если лимит попыток исчерпан — возвращает null.
 * @param tokenId - Идентификатор токена бота
 * @param maxAttempts - Максимальное количество попыток
 * @returns Задержка в миллисекундах или null если лимит исчерпан
 */
export function getRestartDelay(tokenId: number, maxAttempts: number): number | null {
  const counter = restartCounters.get(tokenId);
  const attempts = counter?.attempts ?? 0;

  if (attempts >= maxAttempts) {
    return null;
  }

  const delayIndex = Math.min(attempts, RESTART_DELAYS.length - 1);
  return RESTART_DELAYS[delayIndex];
}

/**
 * Увеличивает счётчик попыток перезапуска для токена.
 * @param tokenId - Идентификатор токена бота
 */
export function incrementRestartCounter(tokenId: number): void {
  const counter = restartCounters.get(tokenId);
  restartCounters.set(tokenId, {
    attempts: (counter?.attempts ?? 0) + 1,
    lastCrashAt: Date.now(),
  });
}

/**
 * Возвращает текущий счётчик попыток для токена (для логирования).
 * @param tokenId - Идентификатор токена бота
 * @returns Объект счётчика или undefined
 */
export function getRestartCounter(tokenId: number): RestartCounter | undefined {
  return restartCounters.get(tokenId);
}

export { STABLE_UPTIME_MS };
