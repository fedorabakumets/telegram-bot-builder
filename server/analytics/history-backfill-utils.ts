/** @fileoverview Отменяемые паузы, безопасные настройки и коды ошибок фонового переноса. */
import type { Pool, PoolClient } from 'pg';
import type { AnalyticsHistoryBackfillOptions, HistoryBackfillSettings } from './history-backfill-types';
/**
 * Ожидает ограниченную паузу, немедленно реагируя на остановку.
 * @param ms - Длительность паузы.
 * @param signal - Сигнал остановки приложения.
 * @returns Завершение паузы или отмены.
 */
export function historyBackfillPause(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise(resolve => {
    /** Завершает ожидание и удаляет обработчик отмены. */
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms); timer.unref?.(); signal.addEventListener('abort', finish, { once: true });
  });
}
/**
 * Проверяет настройки без передачи исходных исключений в пользовательские журналы.
 * @param options - Необязательные настройки.
 * @returns Настройки с защищённым logger.
 */
export function historyBackfillSettings(options: AnalyticsHistoryBackfillOptions): HistoryBackfillSettings {
  /** Ограничивает целое значение заданным диапазоном. */
  const integer = (value: number | undefined, fallback: number, max: number, min = 0) => value !== undefined && Number.isSafeInteger(value) && value >= min && value <= max ? value : fallback;
  return { batchSize: integer(options.batchSize, 100, 1000, 1), pauseMs: integer(options.pauseMs, 100, 60000),
    retryBaseMs: integer(options.retryBaseMs, 1000, 60000, 1), lockRetryMs: integer(options.lockRetryMs, 5000, 60000, 1),
    maxRetries: integer(options.maxRetries, 3, 10), log: event => { try { (options.logger || (value => console.info('[analytics-history]', JSON.stringify(value))))(event); } catch { /* Логирование не прерывает запись. */ } } };
}
/**
 * Извлекает только безопасный SQLSTATE; тексты ошибки могут содержать исходные данные.
 * @param error - Внутренняя ошибка.
 * @returns Код для агрегированного статуса.
 */
export function historyBackfillErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && /^[A-Z0-9]{5}$/.test(code) ? code : 'internal_error';
}
/**
 * Получает соединение с отменой ожидания; поздно выданное соединение возвращается в пул.
 * @param pool - Пул приложения.
 * @param signal - Остановка исполнителя.
 * @returns Соединение либо null при остановке.
 */
export function connectHistoryBackfill(pool: Pool, signal: AbortSignal): Promise<PoolClient | null> {
  if (signal.aborted) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let settled = false;
    /** Отменяет ожидание, не оставляя будущую выдачу соединения занятой. */
    const abort = () => { settled = true; resolve(null); };
    signal.addEventListener('abort', abort, { once: true });
    pool.connect().then(client => { signal.removeEventListener('abort', abort); if (settled) client.release(); else { settled = true; resolve(client); } },
      error => { signal.removeEventListener('abort', abort); if (!settled) { settled = true; reject(error); } });
  });
}
