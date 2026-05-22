/**
 * @fileoverview Хендлеры для работы с файлами проекта.
 * Поддерживает получение файлов из разных источников (bot_messages, media_files)
 * и ручное добавление file_id в файловое хранилище.
 * @module botIntegration/handlers/botData/getProjectFilesHandler
 */

import type { Request, Response } from "express";
import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { botMessages, mediaFiles } from "@shared/schema";

/** Допустимые типы медиа для фильтрации (GET) */
const MEDIA_TYPES = ["photo", "video", "audio", "voice", "document", "sticker"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

/** Допустимые типы медиа для ручного добавления file_id (POST) */
const ADD_FILE_MEDIA_TYPES = ["photo", "video", "animation", "audio", "voice", "video_note", "document", "sticker"] as const;
type AddFileMediaType = (typeof ADD_FILE_MEDIA_TYPES)[number];

/** Маппинг mediaType → fileType для таблицы media_files */
const MEDIA_TYPE_TO_FILE_TYPE: Record<AddFileMediaType, string> = {
  photo: "photo",
  video: "video",
  animation: "video",
  audio: "audio",
  voice: "audio",
  video_note: "video",
  document: "document",
  sticker: "document",
};

/** Маппинг mediaType → mimeType по умолчанию */
const MEDIA_TYPE_TO_MIME: Record<AddFileMediaType, string> = {
  photo: "image/jpeg",
  video: "video/mp4",
  animation: "video/mp4",
  audio: "audio/mpeg",
  voice: "audio/ogg",
  video_note: "video/mp4",
  document: "application/octet-stream",
  sticker: "image/webp",
};

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

/**
 * Добавляет file_id вручную в файловое хранилище проекта.
 * Создаёт запись в таблице media_files с метаданными и маппингом tokenId → file_id.
 *
 * @route POST /api/projects/:projectId/files
 * @param req - Запрос с projectId в params и данными файла в body
 * @param res - Ответ с созданной записью файла
 */
export async function addProjectFileHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ success: false, message: "Неверный projectId" });
      return;
    }

    const { mediaType, fileIdsByToken, fileName, description, tags } = req.body;

    // Валидация mediaType
    if (!mediaType || !ADD_FILE_MEDIA_TYPES.includes(mediaType)) {
      res.status(400).json({
        success: false,
        message: `mediaType обязателен. Допустимые: ${ADD_FILE_MEDIA_TYPES.join(", ")}`,
      });
      return;
    }

    // Валидация fileIdsByToken
    if (!fileIdsByToken || typeof fileIdsByToken !== "object" || Object.keys(fileIdsByToken).length === 0) {
      res.status(400).json({
        success: false,
        message: "fileIdsByToken должен содержать хотя бы одну запись (tokenId → file_id)",
      });
      return;
    }

    const typedMediaType = mediaType as AddFileMediaType;
    const fileType = MEDIA_TYPE_TO_FILE_TYPE[typedMediaType];
    const mimeType = MEDIA_TYPE_TO_MIME[typedMediaType];
    const generatedName = fileName || `file_id_${mediaType}_${Date.now()}`;
    const firstFileId = Object.values(fileIdsByToken)[0] as string;

    // Формируем URL как JSON-строку с метаданными file_id
    const urlPayload = JSON.stringify({
      __type: "file_id",
      mediaType,
      fileIdsByToken,
    });

    const [created] = await db.insert(mediaFiles).values({
      projectId,
      fileName: generatedName,
      fileType,
      filePath: "",
      fileSize: 0,
      mimeType,
      url: urlPayload,
      description: description ?? null,
      tags: tags ?? [],
      telegramFileId: firstFileId,
    }).returning();

    res.json({
      success: true,
      file: {
        id: created.id,
        fileName: created.fileName,
        fileType: created.fileType,
        url: created.url,
        telegramFileId: created.telegramFileId,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error("Ошибка добавления file_id в хранилище:", error);
    res.status(500).json({ success: false, message: "Не удалось добавить файл" });
  }
}
