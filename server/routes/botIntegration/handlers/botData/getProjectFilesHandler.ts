/**
 * @fileoverview Хендлер для получения файлов проекта из разных источников.
 * Поддерживает входящие/исходящие сообщения (bot_messages) и загруженные файлы (media_files).
 * @module botIntegration/handlers/botData/getProjectFilesHandler
 */

import type { Request, Response } from "express";
import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { botMessages, mediaFiles } from "@shared/schema";

/** Допустимые типы медиа для фильтрации */
const MEDIA_TYPES = ["photo", "video", "audio", "voice", "document", "sticker"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

/** Допустимые источники файлов */
const VALID_SOURCES = ["incoming", "outgoing", "uploaded"] as const;
type FileSource = (typeof VALID_SOURCES)[number];

/**
 * Извлекает тип медиа и данные из messageData (jsonb)
 * @param messageData - Данные сообщения из БД
 * @returns Объект с типом медиа и данными файла, или null
 */
function extractMediaInfo(messageData: any): { mediaType: MediaType; data: any } | null {
  if (!messageData || typeof messageData !== "object") return null;
  for (const type of MEDIA_TYPES) {
    if (messageData[type]) {
      return { mediaType: type, data: messageData[type] };
    }
  }
  return null;
}

/**
 * Возвращает список файлов проекта с пагинацией и фильтрацией.
 *
 * @route GET /api/projects/:projectId/files?source=incoming|outgoing|uploaded&type=...&tokenId=...&page=...&limit=...
 * @param req - Запрос с projectId в params и query-параметрами фильтрации
 * @param res - Ответ со списком файлов и метаданными пагинации
 */
export async function getProjectFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const source = req.query.source as string;
    const type = req.query.type as string | undefined;
    const tokenId = req.query.tokenId ? parseInt(req.query.tokenId as string, 10) : undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const offset = (page - 1) * limit;

    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный projectId" });
      return;
    }

    if (!source || !VALID_SOURCES.includes(source as FileSource)) {
      res.status(400).json({ message: "Параметр source обязателен: incoming | outgoing | uploaded" });
      return;
    }

    if (type && !MEDIA_TYPES.includes(type as MediaType)) {
      res.status(400).json({ message: `Неверный type. Допустимые: ${MEDIA_TYPES.join(", ")}` });
      return;
    }

    if (source === "uploaded") {
      const result = await queryUploadedFiles(projectId, type as MediaType | undefined, limit, offset);
      res.json({ files: result.files, total: result.total, page, limit });
      return;
    }

    const result = await queryMessageFiles(projectId, source as "incoming" | "outgoing", type as MediaType | undefined, tokenId, limit, offset);
    res.json({ files: result.files, total: result.total, page, limit });
  } catch (error) {
    console.error("Ошибка получения файлов проекта:", error);
    res.status(500).json({ message: "Не удалось получить файлы проекта" });
  }
}

/**
 * Запрашивает файлы из таблицы bot_messages (incoming/outgoing)
 * @param projectId - ID проекта
 * @param source - Источник: incoming (user) или outgoing (bot)
 * @param type - Фильтр по типу медиа
 * @param tokenId - Фильтр по ID токена бота
 * @param limit - Лимит записей
 * @param offset - Смещение для пагинации
 */
async function queryMessageFiles(projectId: number, source: "incoming" | "outgoing", type: MediaType | undefined, tokenId: number | undefined, limit: number, offset: number) {
  const messageType = source === "incoming" ? "user" : "bot";

  // Строим условия фильтрации
  const conditions = [
    eq(botMessages.projectId, projectId),
    eq(botMessages.messageType, messageType),
    isNotNull(botMessages.messageData),
  ];

  if (tokenId !== undefined) {
    conditions.push(eq(botMessages.tokenId, tokenId));
  }

  // Фильтр по наличию медиа в messageData
  if (type) {
    conditions.push(sql`${botMessages.messageData}->>${sql.raw(`'${type}'`)} IS NOT NULL`);
  } else {
    // Любой медиа-тип
    const mediaCondition = sql`(${sql.join(
      MEDIA_TYPES.map(t => sql`${botMessages.messageData}->>${sql.raw(`'${t}'`)} IS NOT NULL`),
      sql` OR `
    )})`;
    conditions.push(mediaCondition);
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(botMessages).where(where).orderBy(desc(botMessages.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(botMessages).where(where),
  ]);

  const files = rows.map(row => {
    const media = extractMediaInfo(row.messageData);
    return {
      id: row.id,
      source,
      mediaType: media?.mediaType ?? null,
      fileId: media?.data?.file_id ?? null,
      fileName: media?.data?.file_name ?? null,
      fileSize: media?.data?.file_size ?? null,
      duration: media?.data?.duration ?? null,
      userId: row.userId,
      tokenId: row.tokenId,
      telegramMessageId: row.telegramMessageId,
      createdAt: row.createdAt,
    };
  });

  return { files, total: countResult[0]?.count ?? 0 };
}

/**
 * Запрашивает загруженные файлы из таблицы media_files
 * @param projectId - ID проекта
 * @param type - Фильтр по типу файла
 * @param limit - Лимит записей
 * @param offset - Смещение для пагинации
 */
async function queryUploadedFiles(projectId: number, type: MediaType | undefined, limit: number, offset: number) {
  const conditions = [eq(mediaFiles.projectId, projectId)];

  if (type) {
    conditions.push(eq(mediaFiles.fileType, type));
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(mediaFiles).where(where).orderBy(desc(mediaFiles.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(mediaFiles).where(where),
  ]);

  const files = rows.map(row => ({
    id: row.id,
    source: "uploaded" as const,
    mediaType: row.fileType,
    fileId: row.telegramFileId ?? null,
    fileName: row.fileName,
    fileSize: row.fileSize,
    duration: null,
    url: row.url,
    createdAt: row.createdAt,
  }));

  return { files, total: countResult[0]?.count ?? 0 };
}
