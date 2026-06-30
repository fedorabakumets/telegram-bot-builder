/**
 * @fileoverview Ручное добавление file_id в файловое хранилище проекта.
 * Создаёт запись media_files с метаданными и маппингом tokenId → file_id.
 * @module botIntegration/handlers/botData/addProjectFileHandler
 */

import type { Request, Response } from "express";

import { db } from "../../../../database/db";
import { mediaFiles } from "@shared/schema";
import { denormalizeFileIdsByToken } from "./project-files-denormalize-tokens";

/** Допустимые типы медиа для ручного добавления file_id */
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

/**
 * Добавляет file_id вручную в файловое хранилище проекта.
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

    if (!mediaType || !ADD_FILE_MEDIA_TYPES.includes(mediaType)) {
      res.status(400).json({
        success: false,
        message: `mediaType обязателен. Допустимые: ${ADD_FILE_MEDIA_TYPES.join(", ")}`,
      });
      return;
    }

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

    const urlPayload = JSON.stringify({ __type: "file_id", mediaType, fileIdsByToken });

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

    // Денормализуем fileIdsByToken в media_file_tokens (источник истины для
    // отображения file_id по ботам; обратная сборка идёт при чтении) — Req 8.4.
    await denormalizeFileIdsByToken(created.id, fileIdsByToken);

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
