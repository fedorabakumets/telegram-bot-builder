/**
 * @fileoverview Запрос файлов из bot_messages (incoming/outgoing) с фильтрами
 * по типу медиа, токену и диапазону дат. Извлекает file_id и обложку из
 * jsonb-поля messageData.
 * @module botIntegration/handlers/botData/project-files-messages-query
 */

import { and, desc, eq, gte, isNotNull, lte, sql, type SQL } from "drizzle-orm";

import { db } from "../../../../database/db";
import { botMessages } from "@shared/schema";
import { COVER_TYPE, MEDIA_TYPES, type FilterMediaType, type MediaType } from "./project-files-types";

/** Элемент выдачи файла из сообщения */
export interface MessageFileDTO {
  /** ID записи bot_messages */
  id: number;
  /** Источник: incoming или outgoing */
  source: "incoming" | "outgoing";
  /** Тип медиа */
  mediaType: MediaType | null;
  /** Telegram file_id */
  fileId: string | null;
  /** Имя файла */
  fileName: string | null;
  /** Размер в байтах */
  fileSize: number | null;
  /** Длительность (видео/аудио) */
  duration: number | null;
  /** file_id обложки (thumbnail) */
  thumbnailFileId: string | null;
  /** ID пользователя-отправителя */
  userId: unknown;
  /** ID токена бота */
  tokenId: number | null;
  /** ID сообщения в Telegram */
  telegramMessageId: unknown;
  /** Дата создания */
  createdAt: Date | null;
}

/**
 * Извлекает тип медиа, данные и file_id обложки из messageData (jsonb).
 * @param messageData - Данные сообщения из БД
 * @returns Тип медиа, данные файла и thumbnailFileId, либо null
 */
function extractMediaInfo(messageData: any): { mediaType: MediaType; data: any; thumbnailFileId: string | null } | null {
  if (!messageData || typeof messageData !== "object") return null;
  for (const type of MEDIA_TYPES) {
    if (messageData[type]) {
      const thumbnailFileId = messageData[type]?.thumbnail?.file_id ?? null;
      return { mediaType: type, data: messageData[type], thumbnailFileId };
    }
  }
  return null;
}

/**
 * Запрашивает файлы из bot_messages для указанного источника.
 * Для типа «обложка» (cover) сообщения не возвращаются (пустой результат).
 * @param projectId - ID проекта
 * @param source - incoming (user) или outgoing (bot)
 * @param type - Фильтр по типу медиа/обложке
 * @param tokenId - Фильтр по токену бота
 * @param dateFrom - Начало диапазона дат
 * @param dateTo - Конец диапазона дат
 * @param limit - Лимит записей
 * @param offset - Смещение для пагинации
 * @returns Список файлов и общее число записей
 */
export async function queryMessageFiles(
  projectId: number,
  source: "incoming" | "outgoing",
  type: FilterMediaType | undefined,
  tokenId: number | undefined,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  limit: number,
  offset: number,
): Promise<{ files: MessageFileDTO[]; total: number }> {
  // Тип «обложка» не применим к сообщениям — отдаём пустой результат
  if (type === COVER_TYPE) {
    return { files: [], total: 0 };
  }

  const messageType = source === "incoming" ? "user" : "bot";
  const conditions: SQL[] = [
    eq(botMessages.projectId, projectId),
    eq(botMessages.messageType, messageType),
    isNotNull(botMessages.messageData),
  ];

  if (tokenId !== undefined) conditions.push(eq(botMessages.tokenId, tokenId));
  if (dateFrom) conditions.push(gte(botMessages.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(botMessages.createdAt, dateTo));

  if (type) {
    conditions.push(sql`${botMessages.messageData}->>${sql.raw(`'${type}'`)} IS NOT NULL`);
  } else {
    const mediaCondition = sql`(${sql.join(
      MEDIA_TYPES.map((t) => sql`${botMessages.messageData}->>${sql.raw(`'${t}'`)} IS NOT NULL`),
      sql` OR `,
    )})`;
    conditions.push(mediaCondition);
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(botMessages).where(where).orderBy(desc(botMessages.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(botMessages).where(where),
  ]);

  const files: MessageFileDTO[] = rows.map((row) => {
    const media = extractMediaInfo(row.messageData);
    return {
      id: row.id,
      source,
      mediaType: media?.mediaType ?? null,
      fileId: media?.data?.file_id ?? null,
      fileName: media?.data?.file_name ?? null,
      fileSize: media?.data?.file_size ?? null,
      duration: media?.data?.duration ?? null,
      thumbnailFileId: media?.thumbnailFileId ?? null,
      userId: row.userId,
      tokenId: row.tokenId,
      telegramMessageId: row.telegramMessageId,
      createdAt: row.createdAt,
    };
  });

  return { files, total: countResult[0]?.count ?? 0 };
}
