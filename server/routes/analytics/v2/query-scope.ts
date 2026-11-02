/** @fileoverview Общие SQL-выборки v2 с дедупликацией людей и физических групповых сообщений. */
/**
 * Создаёт CTE с областью $1/$2, границами $3/$4 и шагом $5.
 * @param entriesOnly - Ограничить события входами для отчёта источников; аудитория остаётся полной.
 * @returns Безопасный статический SQL без пользовательских фрагментов.
 */
export function v2ScopeSql(entriesOnly = false): string {
  return `WITH scoped AS (
    SELECT e.*, (e.directed OR (e.kind='message_in' AND e.chat_type IN ('group','supergroup') AND EXISTS (
      SELECT 1 FROM analytics_audience_evidence_v2 a WHERE a.project_id=e.project_id AND (a.token_id=e.token_id OR $2::integer IS NULL)
        AND a.reason='addressed_command' AND a.message_event_key=e.event_key))) AS confirmed_directed
    FROM analytics_events_v2 e WHERE e.project_id=$1 AND ($2::integer IS NULL OR e.token_id=$2) AND e.occurred_at<$4::timestamptz
      ${entriesOnly ? "AND directed AND metadata->>'entry'='true'" : ''}
  ), dedup AS (
    SELECT DISTINCT ON (CASE WHEN $2::integer IS NULL AND kind='message_in' AND chat_type IN ('group','supergroup')
      THEN 'group:'||COALESCE(chat_id,'')||':'||event_key ELSE 'bot:'||token_id||':'||event_key END) *
    FROM scoped ORDER BY CASE WHEN $2::integer IS NULL AND kind='message_in' AND chat_type IN ('group','supergroup')
      THEN 'group:'||COALESCE(chat_id,'')||':'||event_key ELSE 'bot:'||token_id||':'||event_key END,confirmed_directed DESC,directed DESC,id
  ), events AS (SELECT * FROM dedup WHERE occurred_at >= $3::timestamptz),
  addressed_only AS (
    SELECT DISTINCT ON (CASE WHEN $2::integer IS NULL THEN a.message_event_key ELSE a.token_id::text||':'||a.message_event_key END)
      a.observed_at FROM analytics_audience_evidence_v2 a
    WHERE a.project_id=$1 AND ($2::integer IS NULL OR a.token_id=$2) AND a.reason='addressed_command'
      AND a.message_event_key IS NOT NULL AND a.observed_at >= $3::timestamptz AND a.observed_at<$4::timestamptz
      AND NOT EXISTS (SELECT 1 FROM scoped s WHERE s.kind='message_in' AND s.event_key=a.message_event_key
        AND (s.token_id=a.token_id OR $2::integer IS NULL))
    ORDER BY CASE WHEN $2::integer IS NULL THEN a.message_event_key ELSE a.token_id::text||':'||a.message_event_key END,a.id
  ),
  contacts AS (
    SELECT user_id,occurred_at FROM events WHERE directed
    UNION ALL SELECT user_id,observed_at FROM analytics_audience_evidence_v2
      WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2) AND observed_at >= $3::timestamptz AND observed_at<$4::timestamptz
  ),
  firsts AS (
    SELECT DISTINCT ON(a.user_id) a.*, a.first_known AND NOT EXISTS(SELECT 1 FROM analytics_legacy_people_v2 l
      WHERE l.project_id=$1 AND ($2::integer IS NULL OR l.token_id=$2) AND l.user_id=a.user_id) AS known
    FROM analytics_audience_v2 a WHERE a.project_id=$1 AND ($2::integer IS NULL OR a.token_id=$2)
      AND a.first_interaction_at<=CURRENT_TIMESTAMP ORDER BY a.user_id,a.first_interaction_at,a.first_known,a.first_event_id,a.token_id
  )`;
}
/**
 * Преобразует SQL-счётчик без незаметной потери точности.
 * @param value - Число или decimal-строка из PostgreSQL.
 * @returns Безопасное неотрицательное целое.
 */
export function v2Count(value: unknown): number {
  const result = Number(value ?? 0);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Счётчик аналитики вне допустимого диапазона');
  return result;
}
