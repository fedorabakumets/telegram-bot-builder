/**
 * @fileoverview Работа с сообщениями поддержки и счётчиками диалога
 * @module server/support/support-messages-repo
 */

import { supportMessages, supportThreads, type SupportMessage } from "@shared/schema";
import type {
  SupportMessageContext,
  SupportMessageSource,
  SupportSender,
} from "@shared/support/support.types";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../database/db";

/** Параметры нового сообщения */
export interface AddSupportMessageParams {
  /** Идентификатор диалога */
  threadId: number;
  /** Отправитель */
  sender: SupportSender;
  /** Текст сообщения */
  text: string;
  /** Контекст отправки (для сообщений пользователя) */
  context?: SupportMessageContext | null;
  /** Источник сообщения */
  source?: SupportMessageSource;
}

/**
 * Возвращает все сообщения диалога по возрастанию
 * @param threadId - Идентификатор диалога
 * @returns Список сообщений
 */
export async function listThreadMessages(threadId: number): Promise<SupportMessage[]> {
  return db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, threadId))
    .orderBy(asc(supportMessages.id));
}

/**
 * Сохраняет сообщение и обновляет диалог в одной транзакции.
 * Сообщение пользователя увеличивает счётчик админа и переоткрывает диалог,
 * ответ админа увеличивает счётчик пользователя.
 * @param params - Параметры сообщения
 * @returns Сохранённое сообщение
 */
export async function addSupportMessage(params: AddSupportMessageParams): Promise<SupportMessage> {
  const { threadId, sender, text, context = null, source = "web" } = params;

  return db.transaction(async (tx) => {
    const [message] = await tx
      .insert(supportMessages)
      .values({ threadId, sender, text, context, source })
      .returning();

    const threadPatch =
      sender === "user"
        ? { unreadByAdmin: sql`${supportThreads.unreadByAdmin} + 1`, status: "open" }
        : { unreadByUser: sql`${supportThreads.unreadByUser} + 1` };

    await tx
      .update(supportThreads)
      .set({ ...threadPatch, lastMessageAt: message.createdAt })
      .where(eq(supportThreads.id, threadId));

    return message;
  });
}
