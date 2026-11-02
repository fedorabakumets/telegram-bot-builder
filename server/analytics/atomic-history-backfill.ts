/** @fileoverview Атомарный перенос всей оставшейся истории: факты, источники и курсоры становятся видны одним commit. */
import type { Pool, PoolClient } from 'pg';
import { backfillAnalyticsBatch } from '../database/analytics-v2/backfill';
import { backfillStartObservationsBatch } from '../database/analytics-v2/start-observations-backfill';
import { captureHistoryBackfillScopes } from './history-backfill-queue';
import { captureStartObservationScopes } from './start-observations-backfill';
import { connectHistoryBackfill, historyBackfillErrorCode, historyBackfillPause, historyBackfillSettings } from './history-backfill-utils';
import type { AnalyticsHistoryBackfillOptions, HistoryBackfillTask } from './history-backfill-types';
/**
 * Выполняет оба контура в уже открытой транзакции; ограниченные чтения не делают промежуточных commit.
 * @param client - Соединение одной транзакции.
 * @param signal - Отмена с полным откатом.
 * @param batchSize - Размер чтения, а не отдельной транзакции.
 * @returns Число обработанных областей.
 */
export async function transferAnalyticsHistoryAtomically(client: PoolClient, signal: AbortSignal, batchSize = 1000): Promise<number> {
  const events = await captureHistoryBackfillScopes(client);
  const markers = await captureStartObservationScopes(client);
  /** Переносит захваченный конечный диапазон без промежуточной публикации данных. */
  async function transfer(scopes: typeof events, execute: HistoryBackfillTask['execute']) {
    for (const scope of scopes) {
      let complete = false;
      while (!complete) {
        signal.throwIfAborted();
        complete = (await execute(client, scope.project, scope.token, batchSize, scope.through)).complete;
      }
    }
  }
  await transfer(events, backfillAnalyticsBatch);
  await transfer(markers, backfillStartObservationsBatch);
  signal.throwIfAborted();
  return events.length + markers.length;
}
/**
 * Запускает одну атомарную операцию после готовности HTTP, координируя её с прежними исполнителями.
 * @param pool - Пул после SQL-миграций.
 * @param options - Повторы и безопасный журнал.
 * @returns Остановка с ожиданием отката или завершения.
 */
export function startAtomicAnalyticsHistoryBackfill(pool: Pool, options: AnalyticsHistoryBackfillOptions = {}): () => Promise<void> {
  const controller = new AbortController();
  const settings = historyBackfillSettings(options);
  /** Повторяет целую операцию; ошибка не оставляет частично обновлённых фактов или курсоров. */
  async function run() {
    let failures = 0;
    while (!controller.signal.aborted) {
      const client = await connectHistoryBackfill(pool, controller.signal);
      if (!client) return;
      let lost = false, waiting = false;
      /** Помечает соединение непригодным для возвращения в пул. */
      const onError = () => { lost = true; };
      client.on('error', onError);
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='2s'");
        const {rows:[locks]} = await client.query('SELECT pg_try_advisory_xact_lock(7262402) events,pg_try_advisory_xact_lock(7262403) markers');
        if (!locks.events || !locks.markers) {
          waiting = true;
          await client.query('ROLLBACK');
        } else {
          settings.log({event:'started'});
          const scopes = await transferAnalyticsHistoryAtomically(client, controller.signal, options.batchSize ?? 1000);
          controller.signal.throwIfAborted();
          await client.query('COMMIT');
          settings.log({event:'completed',scopes});
          return;
        }
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {lost=true;});
        if (controller.signal.aborted) {settings.log({event:'cancelled'});return;}
        failures++;
        settings.log({event:failures>settings.maxRetries?'failed':'retry',attempt:failures,code:historyBackfillErrorCode(error)});
        if(failures>settings.maxRetries)return;
      } finally {client.removeListener('error',onError);client.release(lost);}
      await historyBackfillPause(waiting?settings.lockRetryMs:settings.retryBaseMs,controller.signal);
    }
  }
  const task=Promise.resolve().then(run).catch(error=>settings.log({event:'failed',code:historyBackfillErrorCode(error)}));
  return async()=>{controller.abort();await task;};
}
