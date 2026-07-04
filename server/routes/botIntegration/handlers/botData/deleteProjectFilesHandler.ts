/**
 * @fileoverview Удаление файлов из хранилища проекта.
 * Для uploaded (media_files) — удаляет запись из БД и физический объект через
 * резолв бэкенда по `storageConfigId` (Req 10.4); для incoming/outgoing
 * (bot_messages) — удаляет запись сообщения.
 * @module botIntegration/handlers/botData/deleteProjectFilesHandler
 */

import type { Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../../../../database/db";
import { botMessages, mediaFiles } from "@shared/schema";
import { VALID_SOURCES, type FileSource } from "./project-files-types";
import { deleteUploadedPhysicalObjects } from "./delete-physical-objects";

/**
 * Удаляет файлы из хранилища проекта.
 * @route DELETE /api/projects/:projectId/files
 * Body: { ids: number[], source: 'incoming' | 'outgoing' | 'uploaded' }
 * @param req - Запрос с projectId в params и массивом ids + source в body
 * @param res - Ответ с количеством удалённых записей
 */
export async function deleteProjectFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ success: false, message: "Неверный projectId" });
      return;
    }

    const { ids, source } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: "ids должен быть непустым массивом" });
      return;
    }

    if (!source || !VALID_SOURCES.includes(source as FileSource)) {
      res.status(400).json({ success: false, message: "source обязателен: incoming | outgoing | uploaded" });
      return;
    }

    let deleted = 0;

    if (source === "uploaded") {
      const rows = await db
        .select({
          id: mediaFiles.id,
          filePath: mediaFiles.filePath,
          storageConfigId: mediaFiles.storageConfigId,
        })
        .from(mediaFiles)
        .where(and(eq(mediaFiles.projectId, projectId), inArray(mediaFiles.id, ids)));

      if (rows.length > 0) {
        await db
          .delete(mediaFiles)
          .where(and(eq(mediaFiles.projectId, projectId), inArray(mediaFiles.id, ids)));
        deleted = rows.length;

        // Удаляем физические объекты через резолв бэкенда по storageConfigId
        // (Req 10.4); отсутствие объекта игнорируется (идемпотентность).
        await deleteUploadedPhysicalObjects(rows);
      }
    } else {
      await db
        .delete(botMessages)
        .where(and(eq(botMessages.projectId, projectId), inArray(botMessages.id, ids)));
      deleted = ids.length;
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Ошибка удаления файлов проекта:", error);
    res.status(500).json({ success: false, message: "Не удалось удалить файлы" });
  }
}
