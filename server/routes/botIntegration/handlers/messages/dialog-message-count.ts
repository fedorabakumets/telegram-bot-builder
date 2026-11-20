/** @fileoverview Подсчёт сообщений выбранной переписки. */
import { pool } from '../../../../database/db';

/**
 * Считает сохранённые сообщения группы или общей истории пользователя.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор бота либо общая область проекта
 * @param chatId - Идентификатор группы или пользователя
 * @param group - Признак групповой переписки
 * @param includeGroupContext - Учитывать входящие сообщения пользователя в группах
 * @returns Количество сохранённых записей
 */
export async function getDialogMessageCount(projectId: number, tokenId: number | null, chatId: string, group: boolean, includeGroupContext = true) {
  const condition = group ? 'm.chat_id = $3' : `m.user_id = $3 AND
    (COALESCE(m.chat_type, 'private') = 'private' OR ($4::boolean AND m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user'))`;
  const { rows } = await pool.query(`SELECT COUNT(*)::integer AS total FROM bot_messages m
    WHERE m.project_id = $1 AND ($2::integer IS NULL OR m.token_id = $2) AND ${condition}`, group ? [projectId, tokenId, chatId] : [projectId, tokenId, chatId, includeGroupContext]);
  return Number(rows[0].total);
}
