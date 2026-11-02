/** @fileoverview Рейтинги людей и групп по уникальным авторам либо контактам с ботами; сообщения сохраняются отдельно. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Snapshot, AnalyticsV2Range, AnalyticsV2Leader } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
/**
 * Читает рейтинги из независимой истории, добавляя имена после агрегации.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Выбранный бот.
 * @param range - Общее окно.
 * @returns Рейтинги пользователей и групп, отдельно по людям и сообщениям.
 */
export async function queryV2Leaders(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range): Promise<AnalyticsV2Snapshot['leaders']> {
  const { rows } = await client.query(`${v2ScopeSql()}, group_contacts AS (
    SELECT chat_id,user_id,kind FROM events WHERE directed AND chat_type IN ('group','supergroup') AND chat_id IS NOT NULL
    UNION ALL SELECT chat_id,user_id,NULL::text FROM analytics_audience_evidence_v2
      WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2) AND chat_type IN ('group','supergroup') AND chat_id IS NOT NULL
        AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz
  ), ranked AS (
    SELECT 'users' category,user_id id,COUNT(*) total,COUNT(*) FILTER(WHERE kind='message_in') messages,
      COUNT(*) FILTER(WHERE kind='callback') callbacks,NULL::bigint people FROM events WHERE directed GROUP BY user_id
    UNION ALL SELECT 'groups',chat_id,COUNT(kind),COUNT(*) FILTER(WHERE kind='message_in'),COUNT(*) FILTER(WHERE kind='callback'),COUNT(DISTINCT user_id)
      FROM group_contacts GROUP BY chat_id
    UNION ALL SELECT 'groups_observed',chat_id,COUNT(*),COUNT(*),0,COUNT(DISTINCT user_id) FROM events
      WHERE kind='message_in' AND chat_type IN ('group','supergroup') AND chat_id IS NOT NULL GROUP BY chat_id
    UNION ALL SELECT 'groups_messages',chat_id,COUNT(*),COUNT(*),0,COUNT(DISTINCT user_id) FROM events
      WHERE kind='message_in' AND chat_type IN ('group','supergroup') AND chat_id IS NOT NULL GROUP BY chat_id
  ), limited AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY category ORDER BY CASE WHEN category='groups_messages' THEN total ELSE COALESCE(people,total) END DESC,id) rank FROM ranked)
    SELECT l.*,CASE WHEN category='users' THEN COALESCE(NULLIF(CONCAT_WS(' ',u.first_name,u.last_name),''),u.username,'Пользователь '||l.id)
      ELSE COALESCE(NULLIF(g.name,''),'Группа '||l.id) END name,u.username
    FROM limited l LEFT JOIN LATERAL (SELECT first_name,last_name,username FROM bot_users
      WHERE l.category='users' AND project_id=$1 AND user_id::text=l.id AND ($2::integer IS NULL OR token_id=$2)
      ORDER BY last_interaction DESC NULLS LAST,token_id LIMIT 1) u ON true
    LEFT JOIN LATERAL (SELECT name FROM bot_groups WHERE l.category<>'users' AND project_id=$1 AND group_id=l.id
      AND ($2::integer IS NULL OR token_id=$2) ORDER BY updated_at DESC NULLS LAST,id LIMIT 1) g ON true
    WHERE rank<=10 ORDER BY l.category,l.rank`, [project, token, range.from, range.to]);
  const result: AnalyticsV2Snapshot['leaders'] = { users: [], groups: [], groups_observed: [], groups_messages: [] };
  for (const row of rows) {
    const item: AnalyticsV2Leader = { id: row.id, name: row.name, username: row.username ?? null,
      ...(row.people != null ? { people: v2Count(row.people) } : {}),
      messages: v2Count(row.messages), callbacks: v2Count(row.callbacks), total: v2Count(row.total) };
    result[row.category as keyof typeof result]?.push(item);
  }
  return result;
}
