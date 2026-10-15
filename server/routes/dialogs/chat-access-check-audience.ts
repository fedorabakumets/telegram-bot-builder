/**
 * @fileoverview Список личных диалогов для массовой проверки доступа.
 * @module server/routes/dialogs/chat-access-check-audience
 */
import { pool } from '../../database/db';

/**
 * Личные диалоги бота. Кто писал только в группе или канале, в проверку не входит:
 * у такого человека нет личного чата, и Telegram отвечает «чат не найден».
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Строковые id чатов
 */
export async function listPrivateUserIds(projectId: number, tokenId: number): Promise<string[]> {
  const result = await pool.query(
    `SELECT u.user_id::text AS id
     FROM bot_users u
     WHERE u.project_id = $1 AND u.token_id = $2 AND u.user_id > 0 AND COALESCE(u.is_bot, 0) = 0
       AND (
         NOT EXISTS (
           SELECT 1 FROM bot_messages m
           WHERE m.project_id = u.project_id AND m.token_id = u.token_id AND m.user_id = u.user_id::text
         )
         OR EXISTS (
           SELECT 1 FROM bot_messages m
           WHERE m.project_id = u.project_id AND m.token_id = u.token_id AND m.user_id = u.user_id::text
             AND (m.chat_type IS NULL OR m.chat_type = 'private' OR m.chat_id = u.user_id::text)
         )
       )
     ORDER BY u.user_id`,
    [projectId, tokenId],
  );
  return result.rows.map((row) => String(row.id));
}
