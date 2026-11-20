/**
 * @fileoverview Список личных диалогов для массовой проверки доступа.
 * @module server/routes/dialogs/chat-access-check-audience
 */
import { confirmedPrivateContactSql } from '../users/user-contact-origin-sql';
import { pool } from '../../database/db';

/**
 * Личные диалоги бота. Кто писал только в группе или канале, в проверку не входит:
 * Исходящие сообщения, системные записи и импорт не подтверждают личное обращение.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Строковые id чатов
 */
export async function listPrivateUserIds(projectId: number, tokenId: number): Promise<string[]> {
  const result = await pool.query(
    `SELECT u.user_id::text AS id
     FROM bot_users u
     WHERE u.project_id = $1 AND u.token_id = $2 AND u.user_id > 0 AND COALESCE(u.is_bot, 0) = 0
       AND ${confirmedPrivateContactSql()}
     ORDER BY u.user_id`,
    [projectId, tokenId],
  );
  return result.rows.map((row) => String(row.id));
}
