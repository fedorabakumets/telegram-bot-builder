/**
 * @fileoverview Список личных диалогов для массовой проверки доступа.
 * @module server/routes/dialogs/chat-access-check-audience
 */
import { pool } from '../../database/db';

/**
 * Личные диалоги бота: положительный user_id и не бот.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Строковые id чатов
 */
export async function listPrivateUserIds(projectId: number, tokenId: number): Promise<string[]> {
  const result = await pool.query(
    `SELECT user_id::text AS id FROM bot_users
     WHERE project_id = $1 AND token_id = $2 AND user_id > 0 AND COALESCE(is_bot, 0) = 0
     ORDER BY user_id`,
    [projectId, tokenId],
  );
  return result.rows.map((row) => String(row.id));
}
