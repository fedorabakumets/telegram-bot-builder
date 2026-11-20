/** @fileoverview Безопасные выражения сортировки и источников полного списка пользователей. */
import { userSourceFallbackSql } from './user-source-fallback-sql';
import { firstSourceKeySql, firstSourceGroupLabelSql, firstSourceJoinsSql, firstSourceFallbackSql } from '../analytics/v2/first-source-sql';
import { userBotUnavailableSql } from './user-bot-unavailable-sql';
import { unverifiedContactSql } from './user-contact-eligibility';
/** Подпись первого контакта использует тот же ключ и свидетельства, что графики. */
export const sourceLabelSql = `COALESCE((SELECT COALESCE(NULLIF(s.name,''),origin.group_label,${firstSourceFallbackSql})
 FROM analytics_audience_v2 f ${firstSourceJoinsSql}
 CROSS JOIN LATERAL (SELECT ${firstSourceKeySql} key,${firstSourceGroupLabelSql} group_label) origin
 WHERE f.project_id=a.project_id AND f.token_id=a.token_id AND f.user_id=a.user_id LIMIT 1),NULL)`;
/** Источник первого обращения в текущей области проекта и бота. */
export const userSourceSql = `COALESCE((SELECT ${sourceLabelSql} FROM analytics_audience_v2 a
 LEFT JOIN analytics_sources s ON s.project_id=a.project_id AND s.id=a.source_id
 WHERE a.project_id=$1 AND ($2::integer IS NULL OR a.token_id=$2) AND a.user_id=u.user_id::text
 AND a.first_interaction_at<=CURRENT_TIMESTAMP
 ORDER BY a.first_interaction_at,a.first_known,a.first_event_id,a.token_id LIMIT 1),${userSourceFallbackSql('u')})`;
/** Популярность источника считается по всей отфильтрованной аудитории до LIMIT и OFFSET. */
export const userSourcePopularitySql = `COUNT(*) OVER (PARTITION BY ${userSourceSql})`;
/** Количество переменных совпадает с числом полей в панели пользователя. */
export const userVariableCountSql = `(SELECT COUNT(*) FROM jsonb_object_keys(
  CASE WHEN jsonb_typeof(u.user_data)='object' THEN u.user_data ELSE '{}'::jsonb END))`;
/** Подпись статуса с тем же приоритетом состояний, что и в таблице. */
export const userStatusSortSql = `CASE WHEN u.is_deleted=1 THEN 'Аккаунт удалён'
  WHEN (${userBotUnavailableSql()}) THEN 'Бот недоступен в Telegram'
  WHEN ${unverifiedContactSql()} THEN 'Не проверен'
  WHEN u.is_blocked=1 THEN 'Пользователь заблокировал бота' WHEN u.is_active=1 THEN 'Активен' ELSE 'Неактивен' END`;
/**
 * Создаёт счётчик только для одного из двух разрешённых видов действий.
 * @param clicks - Считать нажатия вместо входящих сообщений.
 * @returns Статический SQL, не содержащий пользовательских значений.
 */
export function userActionCountSql(clicks: boolean): string {
  return `((SELECT COUNT(*) FROM analytics_events_v2 e WHERE e.project_id=$1
    AND ($2::integer IS NULL OR e.token_id=$2) AND e.user_id=u.user_id::text
    AND e.chat_type='private' AND e.kind='${clicks ? 'callback' : 'message_in'}' AND e.occurred_at<CURRENT_TIMESTAMP)
    ${clicks ? `+(SELECT COUNT(*) FROM analytics_audience_evidence_v2 h WHERE h.project_id=$1
      AND ($2::integer IS NULL OR h.token_id=$2) AND h.user_id=u.user_id::text
      AND h.chat_type='private' AND h.reason='legacy_callback' AND h.observed_at<CURRENT_TIMESTAMP)` : ''})`;
}
