/** @fileoverview Чтение общей истории пользователя с сохранением медиа и источников сообщений. */
import { pool } from '../../database/db';
import { storage } from '../../storages/storage';
import { mapUserHistoryRow, USER_HISTORY_QUERY } from './user-history-query';

/**
 * Загружает последние личные сообщения и сообщения пользователя в группах выбранного бота.
 * @param projectId - Проект
 * @param tokenId - Проверенный токен проекта либо все боты проекта
 * @param userId - Пользователь Telegram
 * @param limit - Максимальное количество сообщений
 * @param messageType - Необязательный фильтр направления
 * @param beforeId - Сообщение, перед которым загружается страница
 * @param includeGroupContext - Добавлять только собственные входящие сообщения пользователя из групп
 * @returns Общая история по возрастанию времени
 */
export async function getUserDialogHistory(projectId: number, tokenId: number | null, userId: string,
  limit: number, messageType?: 'user' | 'bot', beforeId?: number, includeGroupContext = true) {
  const { rows } = await pool.query(USER_HISTORY_QUERY, [projectId, tokenId, userId, messageType ?? null, limit, beforeId ?? null, includeGroupContext]);
  const messages = await Promise.all(rows.map(async (row) => ({
    ...mapUserHistoryRow(row), media: await storage.getMessageMedia(row.id),
  })));
  return messages.reverse();
}
