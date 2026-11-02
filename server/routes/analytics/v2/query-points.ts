/** @fileoverview Временные ряды общего снимка, включая пустые интервалы без выдуманных событий. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Point, AnalyticsV2Range } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
import { v2SlotsSql, v2BucketDateSql } from './query-slots';
import { historicalScopeSql, messageScopeSql, messageScope, scopeColumnsSql } from './query-message-scope';
/**
 * Строит до пятисот согласованных точек.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Бот либо весь проект.
 * @param range - Границы и шаг.
 * @returns Ряд без суммы уникальных людей между днями.
 */
export async function queryV2Points(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range): Promise<AnalyticsV2Point[]> {
  const { rows } = await client.query(`${v2ScopeSql()}, ${v2SlotsSql()}, counts AS (
      SELECT ${v2BucketDateSql('e.occurred_at')} date,
        COUNT(*) FILTER(WHERE kind='message_in') incoming,COUNT(*) FILTER(WHERE kind='message_out') outgoing,
        COUNT(*) FILTER(WHERE kind='message_in' AND (chat_type='private' OR chat_type IN ('group','supergroup') AND confirmed_directed)) incoming_to_bot,
        COUNT(*) FILTER(WHERE kind='callback') callbacks,COUNT(*) FILTER(WHERE kind='system') system,
        ${messageScopeSql()},
        COUNT(DISTINCT chat_id) FILTER(WHERE chat_type IN ('group','supergroup')) groups_active,
        COUNT(DISTINCT e.user_id) FILTER(WHERE kind='message_in' AND chat_type IN ('group','supergroup')) group_participants,
        COUNT(*) FILTER(WHERE directed AND chat_type IN ('group','supergroup')) group_directed_actions
      FROM events e GROUP BY date
    ), historical AS (
      SELECT ${v2BucketDateSql('observed_at')} date,COUNT(*) historical_callbacks,${historicalScopeSql()}
      FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
        AND reason='legacy_callback' AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz GROUP BY date
    ), addressed_counts AS (
      SELECT ${v2BucketDateSql('observed_at')} date,COUNT(*) missing_addressed FROM addressed_only GROUP BY date
    ), contact_counts AS (
      SELECT ${v2BucketDateSql('c.occurred_at')} date,
        COUNT(DISTINCT c.user_id) active_users,COUNT(DISTINCT c.user_id) FILTER(WHERE f.first_interaction_at<$3::timestamptz) returning_users
      FROM contacts c LEFT JOIN firsts f ON f.user_id=c.user_id GROUP BY date
    ), newcomers AS (
      SELECT ${v2BucketDateSql('f.first_interaction_at')} date,
        COUNT(*) FILTER(WHERE known) new_users,COUNT(*) FILTER(WHERE NOT known) restored_users
      FROM firsts f WHERE f.first_interaction_at >= $3::timestamptz AND f.first_interaction_at<$4::timestamptz GROUP BY date
    ) SELECT s.date,s.end_date,a.active_users,a.returning_users,c.incoming,c.incoming_to_bot,c.outgoing,c.callbacks,h.historical_callbacks,${scopeColumnsSql()},x.missing_addressed,c.system,n.new_users,n.restored_users,c.groups_active,c.group_participants,c.group_directed_actions
      FROM slots s LEFT JOIN counts c USING(date) LEFT JOIN historical h USING(date) LEFT JOIN addressed_counts x USING(date) LEFT JOIN contact_counts a USING(date) LEFT JOIN newcomers n USING(date) ORDER BY s.date`,
  [project, token, range.from, range.to, range.step_ms, range.timezone]);
  return rows.map(row => ({ date: new Date(row.date).toISOString(), end_date: new Date(row.end_date).toISOString(), new_users: v2Count(row.new_users), restored_users: v2Count(row.restored_users), active_users: v2Count(row.active_users),
    returning_users: v2Count(row.returning_users), incoming: v2Count(row.incoming), incoming_to_bot: v2Count(row.incoming_to_bot) + v2Count(row.missing_addressed), outgoing: v2Count(row.outgoing), callbacks: v2Count(row.callbacks), historical_callbacks: v2Count(row.historical_callbacks), system: v2Count(row.system),
    chat_scopes: { private: messageScope(row, 'private'), group: { ...messageScope(row, 'group'), incoming_to_bot: v2Count(row.group_incoming_to_bot) + v2Count(row.missing_addressed) } },
    groups_active: v2Count(row.groups_active), group_participants: v2Count(row.group_participants), group_directed_actions: v2Count(row.group_directed_actions) }));
}
