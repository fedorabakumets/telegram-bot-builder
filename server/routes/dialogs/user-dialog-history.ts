/** @fileoverview Чтение общей истории пользователя с сохранением медиа и источников сообщений. */
import { pool } from '../../database/db';
import { storage } from '../../storages/storage';
import { mapUserHistoryRow, USER_HISTORY_QUERY } from './user-history-query';

/**
 * Загружает последние личные сообщения и сообщения пользователя в группах выбранного бота.
 * @param projectId - Проект
 * @param tokenId - Проверенный токен проекта
 * @param userId - Пользователь Telegram
 * @param limit - Максимальное количество сообщений
 * @param messageType - Необязательный фильтр направления
 * @returns Общая история по возрастанию времени
 */
export async function getUserDialogHistory(projectId: number, tokenId: number, userId: string,
  limit: number, messageType?: 'user' | 'bot') {
  const { rows } = await pool.query(USER_HISTORY_QUERY, [projectId, tokenId, userId, messageType ?? null, limit]);
  const messages = await Promise.all(rows.map(async (row) => ({
    ...mapUserHistoryRow(row), media: await storage.getMessageMedia(row.id),
  })));
  return messages.reverse();
}
