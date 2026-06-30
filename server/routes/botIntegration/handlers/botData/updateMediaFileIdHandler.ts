/**
 * @fileoverview Точечное добавление/обновление file_id медиафайла по токену.
 * Денормализует пары (медиафайл, токен) в media_file_tokens и синхронизирует
 * JSON-кэш url ({"__type":"file_id",...}) и telegramFileId — Req 8.4.
 * @module botIntegration/handlers/botData/updateMediaFileIdHandler
 */

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../../../database/db";
import { mediaFiles, mediaFileTokens } from "@shared/schema";
import { denormalizeFileIdsByToken, type FileIdsByTokenInput } from "./project-files-denormalize-tokens";

/**
 * Извлекает карту fileIdsByToken из тела запроса. Поддерживает два формата:
 * одиночный `{ tokenId, fileId }` и карту `{ fileIdsByToken: {...} }`.
 * @param body - Тело запроса
 * @returns Карта tokenId → file_id (пустая, если данные не распознаны)
 */
function extractFileIds(body: unknown): FileIdsByTokenInput {
  const data = (body ?? {}) as Record<string, unknown>;
  if (data.fileIdsByToken && typeof data.fileIdsByToken === "object") {
    return data.fileIdsByToken as FileIdsByTokenInput;
  }
  if (data.tokenId !== undefined && typeof data.fileId === "string") {
    return { [String(data.tokenId)]: data.fileId };
  }
  return {};
}

/**
 * Перечитывает все file_id медиафайла из media_file_tokens и пересобирает
 * JSON-кэш url ({"__type":"file_id"}) и telegramFileId, если это file_id-запись.
 * @param mediaFileId - ID записи media_files
 */
async function syncUrlCache(mediaFileId: number): Promise<void> {
  const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, mediaFileId));
  if (!file) {
    return;
  }
  const tokens = await db
    .select({ tokenId: mediaFileTokens.tokenId, fileId: mediaFileTokens.fileId })
    .from(mediaFileTokens)
    .where(eq(mediaFileTokens.mediaFileId, mediaFileId));
  if (tokens.length === 0) {
    return;
  }
  const fileIdsByToken: Record<string, string> = {};
  for (const t of tokens) {
    fileIdsByToken[String(t.tokenId)] = t.fileId;
  }
  const updates: Record<string, unknown> = { telegramFileId: tokens[0].fileId };
  let mediaType = "photo";
  try {
    const parsed = JSON.parse(file.url ?? "");
    if (parsed && parsed.__type === "file_id") {
      mediaType = parsed.mediaType ?? mediaType;
      updates.url = JSON.stringify({ __type: "file_id", mediaType, fileIdsByToken });
    }
  } catch {
    // url не является JSON file_id-записью — кэш url не трогаем
  }
  await db.update(mediaFiles).set(updates).where(eq(mediaFiles.id, mediaFileId));
}

/**
 * Точечно добавляет/обновляет file_id медиафайла для одного или нескольких ботов.
 * @route POST /api/media/:id/file-id
 * @param req - Запрос с id медиафайла в params и { tokenId, fileId } | { fileIdsByToken } в body
 * @param res - Ответ с количеством записанных пар
 */
export async function updateMediaFileIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const mediaFileId = parseInt(req.params.id, 10);
    if (Number.isNaN(mediaFileId)) {
      res.status(400).json({ success: false, message: "Неверный id медиафайла" });
      return;
    }

    const fileIdsByToken = extractFileIds(req.body);
    if (Object.keys(fileIdsByToken).length === 0) {
      res.status(400).json({
        success: false,
        message: "Требуется { tokenId, fileId } или { fileIdsByToken: { tokenId: fileId } }",
      });
      return;
    }

    const [file] = await db
      .select({ id: mediaFiles.id })
      .from(mediaFiles)
      .where(eq(mediaFiles.id, mediaFileId));
    if (!file) {
      res.status(404).json({ success: false, message: "Медиафайл не найден" });
      return;
    }

    const { written } = await denormalizeFileIdsByToken(mediaFileId, fileIdsByToken);
    if (written === 0) {
      res.status(400).json({ success: false, message: "Нет валидных пар (tokenId → file_id)" });
      return;
    }

    await syncUrlCache(mediaFileId);

    res.json({ success: true, mediaFileId, written });
  } catch (error) {
    console.error("Ошибка обновления file_id медиафайла:", error);
    res.status(500).json({ success: false, message: "Не удалось обновить file_id" });
  }
}
