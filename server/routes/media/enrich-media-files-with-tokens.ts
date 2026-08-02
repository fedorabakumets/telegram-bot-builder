/**
 * @fileoverview Обогащение списка media_files картой fileIdsByToken из media_file_tokens.
 * @module server/routes/media/enrich-media-files-with-tokens
 */

import {
  buildFileIdsByTokenMap,
  type FileIdsByToken,
} from "../botIntegration/handlers/botData/project-files-tokens";

/** Медиафайл с опциональной картой file_id по токенам */
export type MediaFileWithTokenMap = {
  /** ID записи media_files */
  id: number;
  /** Карта tokenId → file_id */
  fileIdsByToken: Record<string, string>;
};

/**
 * Преобразует карту с числовыми ключами в строковые (для JSON/UI).
 * @param map - Карта tokenId → file_id
 * @returns Карта со строковыми ключами
 */
function toStringKeys(map: FileIdsByToken): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [tokenId, fileId] of Object.entries(map)) {
    out[String(tokenId)] = fileId;
  }
  return out;
}

/**
 * Добавляет fileIdsByToken к каждому медиафайлу из media_file_tokens.
 * @param files - Строки media_files
 * @returns Те же файлы с полем fileIdsByToken
 */
export async function enrichMediaFilesWithTokens<T extends { id: number }>(
  files: T[],
): Promise<Array<T & { fileIdsByToken: Record<string, string> }>> {
  const tokenMap = await buildFileIdsByTokenMap(files.map((f) => f.id));
  return files.map((file) => ({
    ...file,
    fileIdsByToken: toStringKeys(tokenMap[file.id] ?? {}),
  }));
}
