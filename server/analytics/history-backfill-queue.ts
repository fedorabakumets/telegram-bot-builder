/** @fileoverview Справедливая фоновая очередь областей с конечной границей, короткими транзакциями и независимыми повторами. */
import type { PoolClient } from 'pg';
import { backfillAnalyticsBatch } from '../database/analytics-v2/backfill';
import type { HistoryBackfillScope, HistoryBackfillSettings, HistoryBackfillTask } from './history-backfill-types';
import { historyBackfillErrorCode, historyBackfillPause } from './history-backfill-utils';
/**
 * Фиксирует верхние границы только действительно существующих пар проект–бот.
 * @param client - Соединение приложения, не runtime бота.
 * @returns Конечная очередь, включая архивных ботов с историей.
 */
export async function captureHistoryBackfillScopes(client: PoolClient): Promise<HistoryBackfillScope[]> {
  const { rows } = await client.query(`SELECT m.project_id project,m.token_id token,MAX(m.id)::text through
    FROM bot_messages m JOIN bot_tokens t ON t.id=m.token_id AND t.project_id=m.project_id
      JOIN bot_projects p ON p.id=t.project_id LEFT JOIN analytics_backfill_v2 b ON b.project_id=m.project_id AND b.token_id=m.token_id
    WHERE m.id>COALESCE(b.last_message_id,0) GROUP BY m.project_id,m.token_id ORDER BY m.project_id,m.token_id`);
  return rows.map(row => ({ project: row.project, token: row.token, through: Number(row.through), failures: 0, retryAt: 0 }));
}
/**
 * Обрабатывает по пачке от каждой области, не задерживая остальные из-за одной ошибки.
 * @param client - Соединение, удерживающее общий advisory lock.
 * @param scopes - Зафиксированные конечные диапазоны.
 * @param settings - Проверенные лимиты и журнал.
 * @param signal - Запрос остановки.
 * @param connectionLost - Проверка утраты соединения между запросами.
 * @param execute - Операция конкретного контура; по умолчанию перенос физических событий.
 * @returns Число завершённых и требующих следующего старта областей.
 */
export async function runHistoryBackfillQueue(client: PoolClient, scopes: HistoryBackfillScope[], settings: HistoryBackfillSettings,
  signal: AbortSignal, connectionLost: () => boolean, execute: HistoryBackfillTask['execute'] = backfillAnalyticsBatch) {
  const queue = [...scopes]; let completed = 0; let failed = 0;
  while (queue.length && !signal.aborted) {
    if (connectionLost()) throw Object.assign(new Error('Соединение фонового переноса потеряно'), { code: '08006' });
    const index = queue.findIndex(scope => scope.retryAt <= Date.now());
    if (index < 0) { await historyBackfillPause(Math.min(60000, Math.max(1, queue.reduce((next, scope) => Math.min(next, scope.retryAt), Infinity) - Date.now())), signal); continue; }
    const [scope] = queue.splice(index, 1);
    try {
      await client.query('BEGIN'); await client.query("SET LOCAL statement_timeout='15s'; SET LOCAL lock_timeout='2s'");
      const progress = await execute(client, scope.project, scope.token, settings.batchSize, scope.through);
      await client.query('COMMIT'); settings.log({ event: 'batch', ...progress.batch }); scope.failures = 0;
      if (progress.complete) completed += 1; else queue.push(scope);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (connectionLost() || /^(08|57P0[123])/.test(historyBackfillErrorCode(error))) throw error;
      scope.failures += 1;
      if (scope.failures > settings.maxRetries) { failed += 1; settings.log({ event: 'scope_failed', failed, code: historyBackfillErrorCode(error) }); }
      else {
        scope.retryAt = Date.now() + Math.min(60000, settings.retryBaseMs * 2 ** (scope.failures - 1)); queue.push(scope);
        settings.log({ event: 'retry', attempt: scope.failures, code: historyBackfillErrorCode(error) });
      }
    }
    await historyBackfillPause(settings.pauseMs, signal);
  }
  return { completed, failed };
}
