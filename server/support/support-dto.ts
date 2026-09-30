/**
 * @fileoverview Преобразование записей поддержки из базы в ответы API
 * @module server/support/support-dto
 */

import type { SupportMessage, SupportThread, TelegramUser } from "@shared/schema";
import type {
  SupportAttachmentDto,
  SupportMessageContext,
  SupportMessageDto,
  SupportMessageSource,
  SupportSender,
  SupportThreadDto,
  SupportThreadStatus,
  SupportUserProfile,
} from "@shared/support/support.types";

/**
 * Преобразует диалог в DTO
 * @param row - Запись support_threads
 * @returns Диалог для ответа API
 */
export function toSupportThreadDto(row: SupportThread): SupportThreadDto {
  return {
    id: row.id,
    status: row.status as SupportThreadStatus,
    unreadByAdmin: row.unreadByAdmin,
    unreadByUser: row.unreadByUser,
    lastMessageAt: row.lastMessageAt.toISOString(),
  };
}

/**
 * Преобразует сообщение в DTO
 * @param row - Запись support_messages
 * @param attachments - Картинки этого сообщения
 * @returns Сообщение для ответа API
 */
export function toSupportMessageDto(
  row: SupportMessage,
  attachments: SupportAttachmentDto[] = [],
): SupportMessageDto {
  return {
    id: row.id,
    sender: row.sender as SupportSender,
    text: row.text,
    context: (row.context as SupportMessageContext | null) ?? null,
    source: row.source as SupportMessageSource,
    createdAt: row.createdAt.toISOString(),
    attachments,
  };
}

/**
 * Преобразует пользователя платформы в краткий профиль
 * @param row - Поля telegram_users
 * @returns Профиль для админки
 */
export function toSupportUserProfile(
  row: Pick<TelegramUser, "id" | "firstName" | "lastName" | "username" | "photoUrl">,
): SupportUserProfile {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName ?? null,
    username: row.username ?? null,
    photoUrl: row.photoUrl ?? null,
  };
}
