/**
 * @fileoverview Уведомления клиентов поддержки после записи в базу
 * @module server/support/notify-support-change
 */

import type { SupportThread } from "@shared/schema";
import type { SupportMessageDto, SupportSender, SupportThreadStatus } from "@shared/support/support.types";
import { broadcastSupportEvent } from "./broadcast-support-event";
import { findThreadById } from "./support-threads-repo";

/**
 * Поля диалога, общие для всех событий сокета
 * @param thread - Актуальная запись диалога
 * @returns Идентификаторы, статус и счётчики
 */
function threadFields(thread: SupportThread) {
  return {
    threadId: thread.id,
    userId: thread.userId,
    status: thread.status as SupportThreadStatus,
    unreadByAdmin: thread.unreadByAdmin,
    unreadByUser: thread.unreadByUser,
  };
}

/**
 * Запускает рассылку и глотает ошибку, чтобы ответ HTTP уже был отдан
 * @param task - Публикация события
 */
export function notifySupportSafe(task: Promise<void>): void {
  task.catch((err) => console.error("[support-ws] Ошибка рассылки:", err));
}

/**
 * Шлёт support:message. Диалог перечитывается: счётчики после вставки уже другие.
 * @param threadId - Идентификатор диалога
 * @param message - Сообщение вместе с вложениями
 */
export async function notifySupportMessage(threadId: number, message: SupportMessageDto): Promise<void> {
  const thread = await findThreadById(threadId);
  if (!thread) return;
  await broadcastSupportEvent({
    type: "support:message",
    ...threadFields(thread),
    message,
  });
}

/**
 * Шлёт support:read с актуальными счётчиками
 * @param thread - Диалог после обнуления счётчика
 * @param reader - Кто прочитал
 */
export async function notifySupportRead(thread: SupportThread, reader: SupportSender): Promise<void> {
  await broadcastSupportEvent({ type: "support:read", ...threadFields(thread), reader });
}

/**
 * Шлёт support:status после закрытия или открытия диалога
 * @param thread - Диалог с новым статусом
 */
export async function notifySupportStatus(thread: SupportThread): Promise<void> {
  await broadcastSupportEvent({ type: "support:status", ...threadFields(thread) });
}
