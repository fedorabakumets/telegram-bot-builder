/** @fileoverview Первые источники, включая группу первого callback, и динамика без перезаписи рекламной атрибуции. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Range, AnalyticsV2Snapshot } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
import { v2SourceOriginsSql } from './query-source-origins';
import { v2SlotsSql, v2BucketDateSql } from './query-slots';
/** Понятные названия происхождения; авторизационная ссылка не подтверждает успешный вход. */
const SOURCE_LABELS: Record<string, string> = { no_marker: 'Без метки источника', unknown: 'Источник неизвестен',
  referral_unknown: 'Реферальный переход без пригласившего', site_login: 'Вход с сайта', auth_candidate: 'Авторизация на сайте', resolved: 'Источник' };
/**
 * Получает распределение и ряд по одной методике первого взаимодействия.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Бот или весь проект.
 * @param range - Общий период.
 * @returns Источники и точки с раздельными точным привлечением и первыми сохранёнными контактами.
 */
export async function queryV2Sources(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range): Promise<Pick<AnalyticsV2Snapshot, 'sources' | 'source_points'>> {
  const { rows: [row] } = await client.query(`${v2ScopeSql(true)}, ${v2SlotsSql()}, ${v2SourceOriginsSql()}, acquired AS (
    SELECT source_key key,COUNT(*) FILTER(WHERE known) new_users,COUNT(*) FILTER(WHERE NOT known) restored_users FROM source_firsts
    WHERE first_interaction_at >= $3::timestamptz AND first_interaction_at<$4::timestamptz GROUP BY key
  ), entered AS (
    SELECT e.source_key key,COUNT(*) starts,
      COUNT(DISTINCT e.user_id) FILTER(WHERE f.first_interaction_at<$3::timestamptz
        AND NOT EXISTS(SELECT 1 FROM analytics_events_v2 origin WHERE origin.id=f.first_event_id AND origin.token_id=e.token_id AND origin.event_key=e.event_key)) returning_users
      FROM source_entries e LEFT JOIN firsts f ON f.user_id=e.user_id
      GROUP BY key
  ), distribution AS (
    SELECT COALESCE(a.key,e.key) id,COALESCE(s.name,n.source_label) label,COALESCE(a.new_users,0) new_users,COALESCE(a.restored_users,0) restored_users,
      COALESCE(e.starts,0) starts,COALESCE(e.returning_users,0) returning_users
    FROM acquired a FULL JOIN entered e USING(key)
    LEFT JOIN analytics_sources s ON s.project_id=$1 AND s.id::text=COALESCE(a.key,e.key)
    LEFT JOIN source_names n ON n.source_key=COALESCE(a.key,e.key)
  ), timeline_counts AS (
    SELECT ${v2BucketDateSql('f.first_interaction_at')} date,
      f.source_key id,COALESCE(s.name,f.source_label) label,COUNT(*) FILTER(WHERE f.known) new_users,COUNT(*) FILTER(WHERE NOT f.known) restored_users
    FROM source_firsts f LEFT JOIN analytics_sources s ON s.project_id=$1 AND s.id::text=f.source_key
    WHERE f.first_interaction_at >= $3::timestamptz AND f.first_interaction_at<$4::timestamptz
      GROUP BY date,f.source_key,s.name,f.source_label
  ), timeline AS (
    SELECT c.*,s.end_date FROM timeline_counts c JOIN slots s USING(date)
  ) SELECT COALESCE((SELECT jsonb_agg(d ORDER BY (new_users+restored_users) DESC,id) FROM distribution d),'[]') sources,
    COALESCE((SELECT jsonb_agg(t ORDER BY date,id) FROM timeline t),'[]') source_points`,
  [project, token, range.from, range.to, range.step_ms, range.timezone]);
  /** Подставляет понятное название статуса без раскрытия исходного параметра. */
  const label = (item: { id: string; label?: string }) => item.label || (item.id.startsWith('observed:') ? item.id.slice(9) : undefined) || SOURCE_LABELS[item.id] || `Источник ${item.id}`;
  return { sources: row.sources.map((item: Record<string, any>) => ({ id: item.id, label: label(item as { id: string }),
    new_users: v2Count(item.new_users), restored_users: v2Count(item.restored_users), returning_users: v2Count(item.returning_users), starts: v2Count(item.starts) })),
  source_points: row.source_points.map((item: Record<string, any>) => ({ date: new Date(item.date).toISOString(), end_date: new Date(item.end_date).toISOString(), id: item.id,
    label: label(item as { id: string }), new_users: v2Count(item.new_users), restored_users: v2Count(item.restored_users) })) };
}
