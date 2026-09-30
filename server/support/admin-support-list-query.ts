/**
 * @fileoverview Запрос списка диалогов поддержки для админки
 * @module server/support/admin-support-list-query
 */

import { supportMessages, supportThreads, telegramUsers } from "@shared/schema";
import type {
  AdminSupportThreadListItem,
  SupportSender,
} from "@shared/support/support.types";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../database/db";
import { toSupportThreadDto, toSupportUserProfile } from "./support-dto";

/** Фильтр списка по статусу */
export type AdminSupportListFilter = "open" | "closed" | "all";

/** Максимум диалогов в одном ответе */
const LIST_LIMIT = 200;

/** Подзапрос: последнее сообщение диалога */
const lastMessage = db
  .selectDistinctOn([supportMessages.threadId], {
    threadId: supportMessages.threadId,
    text: supportMessages.text,
    sender: supportMessages.sender,
  })
  .from(supportMessages)
  .orderBy(supportMessages.threadId, desc(supportMessages.id))
  .as("last_message");

/**
 * Загружает диалоги с автором и превью последнего сообщения.
 * Сначала диалоги с непрочитанным, затем по времени последнего сообщения.
 * @param filter - Фильтр по статусу
 * @returns Список диалогов
 */
export async function queryAdminSupportThreads(
  filter: AdminSupportListFilter,
): Promise<AdminSupportThreadListItem[]> {
  const rows = await db
    .select({
      thread: supportThreads,
      user: {
        id: telegramUsers.id,
        firstName: telegramUsers.firstName,
        lastName: telegramUsers.lastName,
        username: telegramUsers.username,
        photoUrl: telegramUsers.photoUrl,
      },
      lastText: lastMessage.text,
      lastSender: lastMessage.sender,
    })
    .from(supportThreads)
    .innerJoin(telegramUsers, eq(supportThreads.userId, telegramUsers.id))
    .leftJoin(lastMessage, eq(lastMessage.threadId, supportThreads.id))
    .where(filter === "all" ? undefined : eq(supportThreads.status, filter))
    .orderBy(
      desc(sql`${supportThreads.unreadByAdmin} > 0`),
      desc(supportThreads.lastMessageAt),
    )
    .limit(LIST_LIMIT);

  return rows.map((row) => ({
    ...toSupportThreadDto(row.thread),
    user: toSupportUserProfile(row.user),
    lastMessageText: row.lastText == null ? null : row.lastText.trim() || "Изображение",
    lastMessageSender: (row.lastSender as SupportSender | null) ?? null,
  }));
}

/**
 * Считает непрочитанные сообщения во всех диалогах
 * @returns Общее количество непрочитанных администратором
 */
export async function countAdminUnread(): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${supportThreads.unreadByAdmin}), 0)::int` })
    .from(supportThreads);
  return row?.total ?? 0;
}
