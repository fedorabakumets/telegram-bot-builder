/** @fileoverview Загрузка ограниченного контекста вокруг сообщения с проверкой проекта, бота и чата. */
import { and, eq, lt, gt, asc, desc } from 'drizzle-orm';
import { botMessages } from '@shared/schema';
import { db } from '../../../../database/db';

/**
 * Находит исходное сообщение и соседние записи в пределах того же диалога.
 * @param projectId - Проект с проверенным доступом
 * @param tokenId - Проверенный токен проекта
 * @param chat - ID пользователя или группы
 * @param messageId - Внутренний ID исходного сообщения
 * @param group - Использовать ID группового чата
 * @returns Сообщения по порядку либо null, если цель не принадлежит области
 */
export async function getMessageContext(projectId: number, tokenId: number, chat: string, messageId: number, group = false) {
  if (!Number.isSafeInteger(messageId) || messageId <= 0) return null;
  const scope = and(eq(botMessages.projectId, projectId), eq(botMessages.tokenId, tokenId), group ? eq(botMessages.chatId, chat) : eq(botMessages.userId, chat));
  const [target] = await db.select().from(botMessages).where(and(scope, eq(botMessages.id, messageId))).limit(1);
  if (!target) return null;
  const [before, after] = await Promise.all([
    db.select().from(botMessages).where(and(scope, lt(botMessages.id, messageId))).orderBy(desc(botMessages.id)).limit(25),
    db.select().from(botMessages).where(and(scope, gt(botMessages.id, messageId))).orderBy(asc(botMessages.id)).limit(25),
  ]);
  return [...before.reverse(), target, ...after];
}
