/** @fileoverview Подсчёт сообщений выбранной переписки. */
import { pool } from '../../../../database/db';

/**
 * Считает сохранённые сообщения группы или общей истории пользователя.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор бота
 * @param chatId - Идентификатор группы или пользователя
 * @param group - Признак групповой переписки
 * @returns Количество сохранённых записей
 */
export async function getDialogMessageCount(projectId: number, tokenId: number, chatId: string, group: boolean) {
  const condition = group ? 'm.chat_id = $3' : `m.user_id = $3 AND
    (COALESCE(m.chat_type, 'private') = 'private' OR (m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user'))`;
  const { rows } = await pool.query(`SELECT COUNT(*)::integer AS total FROM bot_messages m
    WHERE m.project_id = $1 AND m.token_id = $2 AND ${condition}`, [projectId, tokenId, chatId]);
  return Number(rows[0].total);
}
