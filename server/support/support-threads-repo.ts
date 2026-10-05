/**
 * @fileoverview Работа с таблицей диалогов поддержки
 * @module server/support/support-threads-repo
 */

import { supportThreads, type SupportThread } from "@shared/schema";
import type { SupportSender, SupportThreadStatus } from "@shared/support/support.types";
import { eq } from "drizzle-orm";
import { db } from "../database/db";

/**
 * Находит диалог пользователя
 * @param userId - Идентификатор пользователя платформы
 * @returns Диалог или null
 */
export async function findThreadByUser(userId: number): Promise<SupportThread | null> {
  const [row] = await db
    .select()
    .from(supportThreads)
    .where(eq(supportThreads.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Находит диалог по идентификатору
 * @param threadId - Идентификатор диалога
 * @returns Диалог или null
 */
export async function findThreadById(threadId: number): Promise<SupportThread | null> {
  const [row] = await db
    .select()
    .from(supportThreads)
    .where(eq(supportThreads.id, threadId))
    .limit(1);
  return row ?? null;
}

/**
 * Возвращает диалог пользователя, создавая его при первом обращении
 * @param userId - Идентификатор пользователя платформы
 * @returns Существующий или новый диалог
 */
export async function getOrCreateThread(userId: number): Promise<SupportThread> {
  await db
    .insert(supportThreads)
    .values({ userId })
    .onConflictDoNothing({ target: supportThreads.userId });

  const thread = await findThreadByUser(userId);
  if (!thread) throw new Error(`Не удалось создать диалог поддержки для ${userId}`);
  return thread;
}

/**
 * Обнуляет счётчик непрочитанного для стороны, которая открыла диалог
 * @param threadId - Идентификатор диалога
 * @param reader - Кто прочитал: пользователь или администратор
 * @returns Обновлённый диалог или null
 */
export async function markThreadRead(
  threadId: number,
  reader: SupportSender,
): Promise<SupportThread | null> {
  const patch = reader === "admin" ? { unreadByAdmin: 0 } : { unreadByUser: 0 };
  const [row] = await db
    .update(supportThreads)
    .set(patch)
    .where(eq(supportThreads.id, threadId))
    .returning();
  return row ?? null;
}

/**
 * Меняет статус диалога
 * @param threadId - Идентификатор диалога
 * @param status - Новый статус
 * @returns Обновлённый диалог или null
 */
export async function setThreadStatus(
  threadId: number,
  status: SupportThreadStatus,
): Promise<SupportThread | null> {
  const [row] = await db
    .update(supportThreads)
    .set({ status })
    .where(eq(supportThreads.id, threadId))
    .returning();
  return row ?? null;
}
