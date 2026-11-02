/** @fileoverview Неблокирующее восстановление старой аналитики при запуске платформы с координацией реплик. */
import type { Pool } from 'pg';
import type { AnalyticsHistoryBackfillOptions, HistoryBackfillScope, HistoryBackfillTask } from './history-backfill-types';
import { backfillAnalyticsBatch } from '../database/analytics-v2/backfill';
import { connectHistoryBackfill, historyBackfillErrorCode, historyBackfillPause, historyBackfillSettings } from './history-backfill-utils';
import { captureHistoryBackfillScopes, runHistoryBackfillQueue } from './history-backfill-queue';
export type { AnalyticsHistoryBackfillOptions, AnalyticsHistoryBackfillLog } from './history-backfill-types';
/** Отдельный ключ не конкурирует с миграциями и живой записью событий. */
export const ANALYTICS_HISTORY_BACKFILL_LOCK = 7262402;
/**
 * Запускает фон после готовности HTTP; тяжёлая работа никогда не блокирует вызов старта.
 * @param pool - Пул платформы после применения миграций.
 * @param options - Ограничения пачек, повторов и безопасный журнал.
 * @returns Асинхронная остановка с отменой пауз и завершением текущей короткой транзакции.
 */
export function startAnalyticsHistoryBackfill(pool: Pool, options: AnalyticsHistoryBackfillOptions = {}): () => Promise<void> {
  return startAnalyticsBackfillTask(pool, { lockKey: ANALYTICS_HISTORY_BACKFILL_LOCK, capture: captureHistoryBackfillScopes, execute: backfillAnalyticsBatch }, options);
}
/**
 * Выполняет выбранный контур истории с общими остановкой, повторами и блокировкой реплик.
 * @param pool - Пул платформы.
 * @param operation - Безопасная операция ограниченной пачки.
 * @param options - Лимиты и журнал.
 * @returns Асинхронная остановка.
 */
export function startAnalyticsBackfillTask(pool: Pool, operation: HistoryBackfillTask, options: AnalyticsHistoryBackfillOptions = {}): () => Promise<void> {
  const controller = new AbortController(); const settings = historyBackfillSettings(options);
  /** Выполняет один конечный запуск и восстанавливает соединение с теми же верхними границами. */
  async function run(): Promise<void> {
    let scopes: HistoryBackfillScope[] | undefined; let failures = 0; let waitingLogged = false;
    while (!controller.signal.aborted) {
      let client: Awaited<ReturnType<typeof connectHistoryBackfill>> = null; let locked = false; let lost = false;
      /** Отмечает разрыв соединения, не оставляя необработанного события error. */
      const disconnected = () => { lost = true; };
      try {
        client = await connectHistoryBackfill(pool, controller.signal); if (!client) break;
        client.on('error', disconnected);
        await client.query("SET statement_timeout='30s'");
        if (!scopes) scopes = await operation.capture(client);
        locked = (await client.query('SELECT pg_try_advisory_lock($1) locked', [operation.lockKey])).rows[0].locked;
        if (!locked) {
          if (!waitingLogged) settings.log({ event: 'waiting', scopes: scopes.length }); waitingLogged = true;
        } else {
          settings.log({ event: 'started', scopes: scopes.length });
          const result = await runHistoryBackfillQueue(client, scopes, settings, controller.signal, () => lost, operation.execute);
          settings.log({ event: controller.signal.aborted ? 'cancelled' : 'completed', scopes: scopes.length, ...result }); return;
        }
      } catch (error) {
        failures += 1; settings.log({ event: failures > settings.maxRetries ? 'failed' : 'retry', attempt: failures, code: historyBackfillErrorCode(error) });
        if (failures > settings.maxRetries) return;
      } finally {
        if (client) {
          if (locked && !lost) await client.query('SELECT pg_advisory_unlock($1)', [operation.lockKey]).catch(() => { lost = true; });
          if (!lost) await client.query('RESET statement_timeout').catch(() => { lost = true; });
          client.removeListener('error', disconnected); client.release(lost);
        }
      }
      await historyBackfillPause(failures ? Math.min(60000, settings.retryBaseMs * 2 ** (failures - 1)) : settings.lockRetryMs, controller.signal);
    }
    settings.log({ event: 'cancelled' });
  }
  /** Перехватывает последнее непредвиденное исключение, чтобы запуск приложения оставался успешным. */
  const task = Promise.resolve().then(run).catch(error => settings.log({ event: 'failed', code: historyBackfillErrorCode(error) }));
  return async () => { controller.abort(); await task; };
}
