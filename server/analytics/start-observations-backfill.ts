/** @fileoverview Автоматическое фоновое восстановление наблюдаемых /start для всех проектов без подтверждения атрибуции. */
import type { Pool, PoolClient } from 'pg';
import { backfillStartObservationsBatch } from '../database/analytics-v2/start-observations-backfill';
import { startAnalyticsBackfillTask } from './history-backfill';
import type { AnalyticsHistoryBackfillOptions, HistoryBackfillScope } from './history-backfill-types';
/**
 * Захватывает конечные границы валидных областей, независимо от курсора физических событий.
 * @param client - Соединение платформы.
 * @returns Очередь проектов и ботов, включая архивных.
 */
async function captureStartObservationScopes(client: PoolClient): Promise<HistoryBackfillScope[]> {
  const { rows } = await client.query(`SELECT m.project_id project,m.token_id token,MAX(m.id)::text through
    FROM bot_messages m JOIN bot_tokens t ON t.id=m.token_id AND t.project_id=m.project_id JOIN bot_projects p ON p.id=t.project_id
      LEFT JOIN analytics_start_observation_backfill_v2 b ON b.project_id=m.project_id AND b.token_id=m.token_id
    WHERE m.id>COALESCE(b.last_message_id,0) GROUP BY m.project_id,m.token_id ORDER BY m.project_id,m.token_id`);
  return rows.map(row => ({ project: row.project, token: row.token, through: Number(row.through), failures: 0, retryAt: 0 }));
}
/**
 * Запускает второй независимый контур после обычного переноса событий.
 * @param pool - Пул после миграций.
 * @param options - Паузы, лимиты и безопасный журнал.
 * @returns Асинхронная остановка.
 */
export function startAnalyticsStartObservationsBackfill(pool: Pool, options: AnalyticsHistoryBackfillOptions = {}): () => Promise<void> {
  return startAnalyticsBackfillTask(pool, { lockKey: 7262403, capture: captureStartObservationScopes, execute: backfillStartObservationsBatch },
    { ...options, logger: options.logger || (event => console.info('[analytics-start-observations]', JSON.stringify(event))) });
}
