/** @fileoverview Загрузка предыдущей страницы сообщений группы. */
import { pool } from '../../../../database/db';
import { storage } from '../../../../storages/storage';
import { safeAuthPayloads } from '../../../../utils/safe-auth-payloads';
import { mapUserHistoryRow } from '../../../dialogs/user-history-query';

/**
 * Возвращает сообщения группы перед заданным сообщением в порядке времени.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор бота
 * @param groupId - Идентификатор группы
 * @param beforeId - Идентификатор первого загруженного сообщения
 * @param limit - Максимальное количество записей
 * @returns Предыдущая страница сообщений с медиа
 */
export async function getOlderGroupMessages(projectId: number, tokenId: number, groupId: string, beforeId: number, limit: number) {
  const { rows } = await pool.query(`SELECT m.* FROM bot_messages m
    WHERE m.project_id = $1 AND m.token_id = $2 AND m.chat_id = $3
      AND (m.created_at, m.id) < (SELECT c.created_at, c.id FROM bot_messages c
        WHERE c.project_id = $1 AND c.token_id = $2 AND c.chat_id = $3 AND c.id = $4)
    ORDER BY m.created_at DESC NULLS LAST, m.id DESC LIMIT $5`, [projectId, tokenId, groupId, beforeId, limit]);
  const messages = await Promise.all(rows.map(async (row) => ({
    ...mapUserHistoryRow(row), media: await storage.getMessageMedia(row.id),
  })));
  return safeAuthPayloads(messages.reverse());
}
