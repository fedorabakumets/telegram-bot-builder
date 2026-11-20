/** @fileoverview Загрузка ограниченного контекста вокруг сообщения с проверкой проекта, бота и чата. */
import { and, eq, or, sql, asc, desc } from 'drizzle-orm';
import { botMessages } from '@shared/schema';
import { db } from '../../../../database/db';

/**
 * Находит исходное сообщение и соседние записи в пределах того же диалога.
 * @param projectId - Проект с проверенным доступом
 * @param tokenId - Проверенный токен проекта либо все боты проекта
 * @param chat - ID пользователя или группы
 * @param messageId - Внутренний ID исходного сообщения
 * @param group - Использовать ID группового чата
 * @param includeGroupContext - Включать только входящие сообщения пользователя в группах
 * @returns Сообщения по порядку либо null, если цель не принадлежит области
 */
export async function getMessageContext(projectId: number, tokenId: number | null, chat: string, messageId: number, group = false, includeGroupContext = true) {
  if (!Number.isSafeInteger(messageId) || messageId <= 0) return null;
  /** И цель, и соседи имеют одинаковые границы проекта, пользователя, бота и приватности. */
  const privateScope = sql`COALESCE(${botMessages.chatType}, 'private') = 'private'`;
  const userScope = includeGroupContext ? or(privateScope, and(sql`${botMessages.chatType} IN ('group', 'supergroup')`, eq(botMessages.messageType, 'user'))) : privateScope;
  const scope = and(eq(botMessages.projectId, projectId), tokenId === null ? undefined : eq(botMessages.tokenId, tokenId),
    group ? eq(botMessages.chatId, chat) : and(eq(botMessages.userId, chat), userScope));
  const [target] = await db.select().from(botMessages).where(and(scope, eq(botMessages.id, messageId))).limit(1);
  if (!target) return null;
  const [before, after] = await Promise.all([
    db.select().from(botMessages).where(and(scope, sql`(${botMessages.createdAt}, ${botMessages.id}) < (${target.createdAt}, ${target.id})`)).orderBy(desc(botMessages.createdAt), desc(botMessages.id)).limit(25),
    db.select().from(botMessages).where(and(scope, sql`(${botMessages.createdAt}, ${botMessages.id}) > (${target.createdAt}, ${target.id})`)).orderBy(asc(botMessages.createdAt), asc(botMessages.id)).limit(25),
  ]);
  return [...before.reverse(), target, ...after];
}
