/** @fileoverview SQL общей истории пользователя без ответов бота другим участникам групп. */

/** SQL истории: проект, токен, пользователь, фильтр направления, предел страницы. */
export const USER_HISTORY_QUERY = `SELECT m.*, bg.name AS source_chat_title
  FROM bot_messages m LEFT JOIN LATERAL (
    SELECT name FROM bot_groups WHERE project_id = m.project_id
      AND token_id = m.token_id AND group_id = m.chat_id ORDER BY id DESC LIMIT 1
  ) bg ON m.chat_type IN ('group', 'supergroup')
  WHERE m.project_id = $1 AND m.token_id = $2 AND m.user_id = $3
    AND (COALESCE(m.chat_type, 'private') = 'private'
      OR (m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user'))
    AND ($4::text IS NULL OR m.message_type = $4)
  ORDER BY m.created_at DESC NULLS LAST, m.id DESC LIMIT $5`;

/**
 * Преобразует SQL-поля сообщения в формат существующего HTTP API.
 * @param row - Строка PostgreSQL
 * @returns Сообщение с исходным чатом и названием группы
 */
export function mapUserHistoryRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value,
  ]));
}
