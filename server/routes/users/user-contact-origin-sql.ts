/** @fileoverview Доказательства личного обращения и групповой истории без исходящих и системных записей. */
/**
 * Ограничивает факты одной связью с ботом либо всей выбранной областью проекта.
 * @param alias - Доверенный псевдоним контакта.
 * @param allBots - Учитывать область $2 вместо бота строки.
 * @returns Условия проекта, пользователя и бота для псевдонима e.
 */
function scope(alias: 'u' | 'b', allBots: boolean): string {
  return `e.project_id=${alias}.project_id AND e.user_id=${alias}.user_id::text AND
    ${allBots ? '($2::integer IS NULL OR e.token_id=$2)' : `e.token_id=${alias}.token_id`}`;
}
/**
 * Подтверждает входящее личное обращение, исключая исходящие, служебные и импортированные строки.
 * @param alias - Псевдоним контакта.
 * @param allBots - Область всех выбранных ботов.
 * @returns SQL-признак подтверждённого личного обращения.
 */
export function confirmedPrivateContactSql(alias: 'u' | 'b' = 'u', allBots = false): string {
  const where = scope(alias,allBots);
  return `(EXISTS(SELECT 1 FROM analytics_events_v2 e WHERE ${where}
      AND e.directed AND e.kind IN ('message_in','callback') AND e.chat_type='private' AND e.occurred_at<=CURRENT_TIMESTAMP)
    OR EXISTS(SELECT 1 FROM analytics_audience_evidence_v2 e WHERE ${where}
      AND e.reason='legacy_callback' AND e.chat_type='private' AND e.observed_at<=CURRENT_TIMESTAMP)
    OR EXISTS(SELECT 1 FROM bot_messages e WHERE ${where} AND e.message_type='user'
      AND (e.chat_type='private' OR e.chat_id=e.user_id)))`;
}
/**
 * Определяет тип контакта, сохраняя приоритет подтверждённой личной переписки.
 * @param alias - Псевдоним контакта.
 * @param allBots - Область всех выбранных ботов.
 * @returns Категория для фильтра и карточки.
 */
export function userContactOriginSql(alias: 'u' | 'b' = 'u', allBots = false): string {
  const where = scope(alias,allBots);
  return `CASE WHEN ${confirmedPrivateContactSql(alias,allBots)} THEN 'private'
    WHEN EXISTS(SELECT 1 FROM analytics_events_v2 e WHERE ${where} AND e.kind IN ('message_in','callback')
      AND e.chat_type IN ('group','supergroup') AND e.occurred_at<=CURRENT_TIMESTAMP)
      OR EXISTS(SELECT 1 FROM bot_messages e WHERE ${where} AND e.message_type='user' AND e.chat_type IN ('group','supergroup')) THEN 'group_history'
    WHEN ${alias}.imported_at IS NOT NULL THEN 'imported' ELSE 'unknown' END`;
}
/**
 * Читает первое сохранённое входящее сообщение или нажатие без подмены датой регистрации.
 * @param alias - Псевдоним контакта.
 * @param allBots - Область всех выбранных ботов.
 * @returns Дата факта либо NULL при отсутствии входящих сообщений.
 */
export function firstSavedMessageSql(alias: 'u' | 'b' = 'u', allBots = false): string {
  const where = scope(alias,allBots);
  return `(SELECT MIN(at) FROM (
    SELECT e.occurred_at at FROM analytics_events_v2 e WHERE ${where} AND e.kind IN ('message_in','callback') AND e.occurred_at<=CURRENT_TIMESTAMP
    UNION ALL SELECT e.observed_at FROM analytics_audience_evidence_v2 e WHERE ${where} AND e.reason='legacy_callback' AND e.observed_at<=CURRENT_TIMESTAMP
    UNION ALL SELECT e.created_at AT TIME ZONE 'UTC' FROM bot_messages e WHERE ${where} AND e.message_type='user'
  ) saved)`;
}
