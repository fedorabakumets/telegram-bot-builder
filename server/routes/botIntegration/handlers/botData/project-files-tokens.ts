/**
 * @fileoverview Сборка fileIdsByToken для загруженных файлов.
 * Читает media_file_tokens для набора медиафайлов одной страницы выдачи
 * и группирует их в карту mediaFileId → { tokenId → file_id } (Req 8.2, 8.3).
 * @module botIntegration/handlers/botData/project-files-tokens
 */

import { inArray } from "drizzle-orm";

import { db } from "../../../../database/db";
import { mediaFileTokens } from "@shared/schema";

/** Карта tokenId → file_id для одного медиафайла */
export type FileIdsByToken = Record<number, string>;

/** Карта mediaFileId → { tokenId → file_id } */
export type FileIdsByMediaFile = Record<number, FileIdsByToken>;

/**
 * Загружает file_id по токенам для набора медиафайлов и группирует их
 * по mediaFileId. Сервер возвращает полную карту; приоритезация
 * выбранного токена — забота клиента.
 * @param mediaFileIds - ID медиафайлов текущей страницы выдачи
 * @returns Карта mediaFileId → { tokenId → file_id }
 */
export async function buildFileIdsByTokenMap(mediaFileIds: number[]): Promise<FileIdsByMediaFile> {
  const result: FileIdsByMediaFile = {};
  if (mediaFileIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      mediaFileId: mediaFileTokens.mediaFileId,
      tokenId: mediaFileTokens.tokenId,
      fileId: mediaFileTokens.fileId,
    })
    .from(mediaFileTokens)
    .where(inArray(mediaFileTokens.mediaFileId, mediaFileIds));

  for (const row of rows) {
    if (!result[row.mediaFileId]) {
      result[row.mediaFileId] = {};
    }
    result[row.mediaFileId][row.tokenId] = row.fileId;
  }
  return result;
}
