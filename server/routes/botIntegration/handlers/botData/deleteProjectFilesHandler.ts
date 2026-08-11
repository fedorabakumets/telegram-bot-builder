/**
 * @fileoverview Удаление файлов хранилища проекта
 * @module botIntegration/handlers/botData/deleteProjectFilesHandler
 */

import type { Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../../../../database/db";
import { botMessages, mediaFiles } from "@shared/schema";
import { VALID_SOURCES, type FileSource } from "./project-files-types";
import { deleteUploadedPhysicalObjects } from "./delete-physical-objects";

/** Элемент удаления: id + источник (нужно для вкладки «all») */
interface DeleteItem {
  /** ID media_files или bot_messages */
  id: number;
  /** Источник записи */
  source: FileSource;
}

/**
 * Нормализует тело: `{ items }` или легаси `{ ids, source|category }`.
 * @param body - Тело DELETE
 * @returns Элементы или текст ошибки
 */
function parseDeleteBody(body: unknown): { items: DeleteItem[] } | { error: string } {
  const b = body as Record<string, unknown> | null;
  if (!b || typeof b !== "object") return { error: "Тело запроса обязательно" };

  if (Array.isArray(b.items)) {
    const items: DeleteItem[] = [];
    for (const raw of b.items) {
      const row = raw as Record<string, unknown>;
      const id = Number(row?.id);
      const source = row?.source as string;
      if (!Number.isFinite(id) || !VALID_SOURCES.includes(source as FileSource)) {
        return { error: "items: каждый элемент — { id, source: incoming|outgoing|uploaded }" };
      }
      items.push({ id, source: source as FileSource });
    }
    if (items.length === 0) return { error: "items должен быть непустым массивом" };
    return { items };
  }

  const ids = b.ids;
  const sourceRaw = (b.source ?? b.category) as string | undefined;
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "ids должен быть непустым массивом (или передайте items)" };
  }
  if (!sourceRaw || sourceRaw === "all" || !VALID_SOURCES.includes(sourceRaw as FileSource)) {
    return { error: "source обязателен: incoming | outgoing | uploaded (не all)" };
  }
  return {
    items: ids.map((id) => ({ id: Number(id), source: sourceRaw as FileSource })),
  };
}

/**
 * Удаляет файлы проекта (uploaded → media_files+диск; incoming/outgoing → bot_messages).
 * @param req - projectId + body items|ids+source
 * @param res - { success, deleted }
 * @returns Promise<void>
 */
export async function deleteProjectFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ success: false, message: "Неверный projectId" });
      return;
    }

    const parsed = parseDeleteBody(req.body);
    if ("error" in parsed) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const bySource: Record<FileSource, number[]> = {
      uploaded: [],
      incoming: [],
      outgoing: [],
    };
    for (const item of parsed.items) {
      if (!Number.isFinite(item.id)) continue;
      bySource[item.source].push(item.id);
    }

    let deleted = 0;

    if (bySource.uploaded.length > 0) {
      const rows = await db
        .select({
          id: mediaFiles.id,
          filePath: mediaFiles.filePath,
          storageConfigId: mediaFiles.storageConfigId,
        })
        .from(mediaFiles)
        .where(
          and(eq(mediaFiles.projectId, projectId), inArray(mediaFiles.id, bySource.uploaded)),
        );

      if (rows.length > 0) {
        await db
          .delete(mediaFiles)
          .where(
            and(eq(mediaFiles.projectId, projectId), inArray(mediaFiles.id, bySource.uploaded)),
          );
        deleted += rows.length;
        await deleteUploadedPhysicalObjects(rows);
      }
    }

    const messageIds = [...bySource.incoming, ...bySource.outgoing];
    if (messageIds.length > 0) {
      const removed = await db
        .delete(botMessages)
        .where(and(eq(botMessages.projectId, projectId), inArray(botMessages.id, messageIds)))
        .returning({ id: botMessages.id });
      deleted += removed.length;
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error("Ошибка удаления файлов проекта:", error);
    res.status(500).json({ success: false, message: "Не удалось удалить файлы" });
  }
}
