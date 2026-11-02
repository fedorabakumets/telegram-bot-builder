/** @fileoverview Текущие свойства подтверждённой аудитории и популярные реальные нажатия. */
import type { PoolClient } from 'pg';
import type { AnalyticsV2Range, AnalyticsV2Snapshot } from '../../../../shared/analytics/v2';
import { v2ScopeSql, v2Count } from './query-scope';
/**
 * Читает текущее состояние профилей отдельно от событий выбранного периода.
 * @param client - Соединение снимка.
 * @param project - Проект.
 * @param token - Бот или весь проект.
 * @param range - Окно популярности кнопок.
 * @returns Состав, доступность и нажатия.
 */
export async function queryV2Composition(client: PoolClient, project: number, token: number | null, range: AnalyticsV2Range): Promise<Pick<AnalyticsV2Snapshot, 'composition' | 'availability' | 'buttons'>> {
  const { rows: [row] } = await client.query(`${v2ScopeSql()}, profiles AS (
    SELECT f.user_id,BOOL_OR(u.is_premium=1) premium,COUNT(u.user_id)>0 present,
      BOOL_OR(COALESCE(u.is_blocked,0)=0 AND COALESCE(u.is_deleted,0)=0 AND u.user_id IS NOT NULL AND EXISTS(
        SELECT 1 FROM analytics_events_v2 p WHERE p.project_id=$1 AND p.token_id=u.token_id AND p.user_id=f.user_id AND p.chat_type='private' AND p.directed)) available,
      BOOL_AND(COALESCE(u.is_deleted,0)=1) deleted,BOOL_OR(u.is_blocked=1) blocked,
      (ARRAY_AGG(NULLIF(u.language_code,'') ORDER BY u.last_interaction DESC NULLS LAST) FILTER(WHERE u.language_code IS NOT NULL))[1] language
    FROM firsts f LEFT JOIN bot_users u ON u.project_id=$1 AND u.user_id::text=f.user_id AND ($2::integer IS NULL OR u.token_id=$2)
    GROUP BY f.user_id
  ), languages AS (SELECT COALESCE(language,'unknown') code,COUNT(*) count FROM profiles GROUP BY language),
  button_contacts AS (
    SELECT COALESCE(NULLIF(metadata->>'button_label',''),'Кнопка без названия') label,user_id,true physical
      FROM events WHERE kind='callback'
    UNION ALL SELECT COALESCE(NULLIF(button_label,''),'Кнопка без названия'),user_id,false
      FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
        AND reason='legacy_callback' AND observed_at >= $3::timestamptz AND observed_at < $4::timestamptz
  ), buttons AS (SELECT label,COUNT(*) FILTER(WHERE physical) count,COUNT(*) FILTER(WHERE NOT physical) historical_count,COUNT(DISTINCT user_id) people
    FROM button_contacts GROUP BY label ORDER BY (COUNT(*)) DESC,label LIMIT 100)
  SELECT COUNT(*) FILTER(WHERE present AND available) available,
    COUNT(*) FILTER(WHERE present AND NOT available AND NOT deleted AND blocked) blocked,
    COUNT(*) FILTER(WHERE present AND deleted) deleted,COUNT(*) FILTER(WHERE premium) premium,
    COUNT(*) FILTER(WHERE present AND premium IS FALSE) regular,COUNT(*) FILTER(WHERE NOT present OR premium IS NULL) unknown,
    (SELECT MAX(finished_at) FROM chat_access_check_jobs WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
      AND status='completed' AND processed_count>=total_count AND error_count=0) checked_at,
    COALESCE((SELECT jsonb_agg(l ORDER BY count DESC,code) FROM languages l),'[]') languages,
    COALESCE((SELECT jsonb_agg(b ORDER BY count DESC,label) FROM buttons b),'[]') buttons FROM profiles`,
  [project, token, range.from, range.to]);
  return { availability: { available: v2Count(row.available), blocked: v2Count(row.blocked), deleted: v2Count(row.deleted), checked_at: row.checked_at ? new Date(row.checked_at).toISOString() : null },
    composition: { premium: v2Count(row.premium), regular: v2Count(row.regular), unknown: v2Count(row.unknown),
      languages: row.languages.map((item: { code: string; count: unknown }) => ({ code: item.code, count: v2Count(item.count) })) },
    buttons: row.buttons.map((item: { label: string; count: unknown; people: unknown; historical_count: unknown }) => ({ label: item.label, count: v2Count(item.count), people: v2Count(item.people), historical_count: v2Count(item.historical_count) })) };
}
