/**
 * @fileoverview Вложения сообщений поддержки: запись и выборка
 * @module server/support/support-attachments-repo
 */

import {
  supportAttachments,
  supportMessages,
  supportThreads,
  type SupportAttachment,
  type SupportMessage,
} from "@shared/schema";
import type { SupportAttachmentDto, SupportMessageDto } from "@shared/support/support.types";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../database/db";
import { toSupportMessageDto } from "./support-dto";

/** Поля новой строки вложения */
export interface InsertSupportAttachment {
  /** Сообщение */
  messageId: number;
  /** Исходное имя */
  fileName: string;
  /** MIME */
  mime: string;
  /** Размер в байтах */
  size: number;
  /** Хранилище */
  storageConfigId: string;
  /** Ключ объекта */
  storageKey: string;
}

/** Вложение вместе с владельцем диалога — для проверки доступа */
export interface SupportAttachmentAccess {
  /** Строка вложения */
  attachment: SupportAttachment;
  /** Автор диалога */
  userId: number;
}

/**
 * Преобразует строку вложения в DTO
 * @param row - Запись support_attachments
 * @returns Вложение без ключа хранилища
 */
function toAttachmentDto(row: SupportAttachment): SupportAttachmentDto {
  return { id: row.id, fileName: row.fileName, mime: row.mime, size: row.size };
}

/**
 * Сохраняет вложения сообщения
 * @param rows - Строки для вставки
 * @returns Сохранённые вложения в том же порядке
 */
export async function insertSupportAttachments(
  rows: InsertSupportAttachment[],
): Promise<SupportAttachmentDto[]> {
  if (rows.length === 0) return [];
  const inserted = await db.insert(supportAttachments).values(rows).returning();
  const byKey = new Map(inserted.map((row) => [row.storageKey, row]));
  return rows.map((row) => {
    const saved = byKey.get(row.storageKey);
    if (!saved) throw new Error("Вложение не сохранилось");
    return toAttachmentDto(saved);
  });
}

/**
 * Добавляет картинки к сообщениям диалога
 * @param messages - Сообщения по порядку
 * @returns Те же сообщения с полем attachments
 */
export async function withSupportAttachments(messages: SupportMessage[]): Promise<SupportMessageDto[]> {
  if (messages.length === 0) return [];
  const rows = await db
    .select()
    .from(supportAttachments)
    .where(inArray(supportAttachments.messageId, messages.map((message) => message.id)))
    .orderBy(asc(supportAttachments.id));

  const grouped = new Map<number, SupportAttachmentDto[]>();
  for (const row of rows) {
    const list = grouped.get(row.messageId) ?? [];
    list.push(toAttachmentDto(row));
    grouped.set(row.messageId, list);
  }
  return messages.map((message) => toSupportMessageDto(message, grouped.get(message.id) ?? []));
}

/**
 * Находит вложение и автора диалога
 * @param id - Идентификатор вложения
 * @returns Строка и userId или null
 */
export async function findSupportAttachmentAccess(id: number): Promise<SupportAttachmentAccess | null> {
  const [row] = await db
    .select({ attachment: supportAttachments, userId: supportThreads.userId })
    .from(supportAttachments)
    .innerJoin(supportMessages, eq(supportAttachments.messageId, supportMessages.id))
    .innerJoin(supportThreads, eq(supportMessages.threadId, supportThreads.id))
    .where(eq(supportAttachments.id, id));
  return row ?? null;
}

/**
 * Возвращает файлы одного сообщения для отправки в Telegram
 * @param messageId - Идентификатор сообщения
 * @returns Вложения по порядку
 */
export async function listMessageAttachmentFiles(messageId: number): Promise<SupportAttachment[]> {
  return db
    .select()
    .from(supportAttachments)
    .where(eq(supportAttachments.messageId, messageId))
    .orderBy(asc(supportAttachments.id));
}
