/** @fileoverview Сборка согласованного снимка подтверждённой аналитики внутри одной транзакции. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Snapshot } from '../../../../shared/analytics/v2';
import { resolveV2Range, previousV2Range } from './range';
import { queryV2Summary } from './query-summary';
import { queryV2Points } from './query-points';
import { queryV2Leaders } from './query-leaders';
import { queryV2Sources } from './query-sources';
import { queryV2Composition } from './query-composition';
import { queryV2Coverage, queryV2NextChange } from './query-coverage';
import { v2HistoryTimesSql } from './query-history-times';
/**
 * Читает все карточки в текущем снимке вызывающей транзакции.
 * @param client - Соединение REPEATABLE READ READ ONLY.
 * @param project - Авторизованный проект.
 * @param token - Проверенный бот либо весь проект.
 * @param query - Строковые параметры диапазона.
 * @param now - Единый момент запроса.
 * @returns Версионированный снимок всей вкладки.
 */
export async function readAnalyticsV2Snapshot(client: PoolClient, project: number, token: number | null,
  query: Record<string, string>, now = Date.now()): Promise<AnalyticsV2Snapshot> {
  const { rows: [initial] } = await client.query(`SELECT MIN(occurred_at) earliest,
    COALESCE((SELECT revision::text FROM analytics_versions_v2 WHERE project_id=$1),'0') revision
    FROM (${v2HistoryTimesSql()}) history`, [project, token]);
  const range = resolveV2Range(query, now, initial.earliest ? new Date(initial.earliest).toISOString() : null);
  const compare = query.comparison === 'previous' && range.period !== 'all';
  const coverage = await queryV2Coverage(client, project, token, range);
  const current = await queryV2Summary(client, project, token, range, coverage.status);
  const previousRange = compare ? previousV2Range(range) : null;
  const previousCoverage = previousRange ? await queryV2Coverage(client, project, token, previousRange) : null;
  const previous = previousCoverage && previousRange ? await queryV2Summary(client, project, token, previousRange, previousCoverage.status) : null;
  const points = await queryV2Points(client, project, token, range);
  const leaders = await queryV2Leaders(client, project, token, range);
  const sources = await queryV2Sources(client, project, token, range);
  const previousSources = previousRange ? (await queryV2Sources(client, project, token, previousRange, false)).sources : null;
  const composition = await queryV2Composition(client, project, token, range);
  /** Счётчики всех ботов проекта для селектора используют ту же подтверждённую аудиторию. */
  const { rows: tokenAudiences } = await client.query(`SELECT t.id token_id,COUNT(a.user_id)::integer total_users
    FROM bot_tokens t LEFT JOIN analytics_audience_v2 a ON a.project_id=t.project_id AND a.token_id=t.id
      AND a.first_interaction_at<=CURRENT_TIMESTAMP WHERE t.project_id=$1 GROUP BY t.id`, [project]);
  const next = await queryV2NextChange(client, project, token, range, compare);
  return { schema_version: 2, project_id: project, token_id: token, as_of: new Date(now).toISOString(), revision: initial.revision,
    range, current, previous, previous_sources: previousSources, points, leaders, token_audiences: tokenAudiences, ...sources, ...composition, coverage, next_recompute_at: next };
}
