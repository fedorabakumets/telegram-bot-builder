/** @fileoverview SQL общей истории пользователя без ответов бота другим участникам групп. */

/** SQL истории: проект, необязательный токен, пользователь, направление, предел, курсор и групповой контекст. */
export const USER_HISTORY_QUERY = `SELECT m.*, bg.name AS source_chat_title
  FROM bot_messages m LEFT JOIN LATERAL (
    SELECT name FROM bot_groups WHERE project_id = m.project_id
      AND token_id = m.token_id AND group_id = m.chat_id ORDER BY id DESC LIMIT 1
  ) bg ON m.chat_type IN ('group', 'supergroup')
  WHERE m.project_id = $1 AND ($2::integer IS NULL OR m.token_id = $2) AND m.user_id = $3
    AND (COALESCE(m.chat_type, 'private') = 'private'
      OR ($7::boolean AND m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user'))
    AND ($4::text IS NULL OR m.message_type = $4)
    AND ($6::integer IS NULL OR (m.created_at, m.id) < (
      SELECT c.created_at, c.id FROM bot_messages c
      WHERE c.id = $6 AND c.project_id = $1 AND ($2::integer IS NULL OR c.token_id = $2) AND c.user_id = $3
        AND (COALESCE(c.chat_type, 'private') = 'private'
          OR ($7::boolean AND c.chat_type IN ('group', 'supergroup') AND c.message_type = 'user'))
    ))
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
