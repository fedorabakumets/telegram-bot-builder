/**
 * @fileoverview Денормализация fileIdsByToken → media_file_tokens.
 * Превращает карту { tokenId → file_id } в строки таблицы media_file_tokens
 * с upsert по уникальной паре (mediaFileId, tokenId) — Req 8.4.
 * @module botIntegration/handlers/botData/project-files-denormalize-tokens
 */

import { sql } from "drizzle-orm";

import { db } from "../../../../database/db";
import { mediaFileTokens } from "@shared/schema";

/** Карта tokenId → file_id (ключи строковые, как в JSON attachedMedia) */
export type FileIdsByTokenInput = Record<string, unknown>;

/** Результат денормализации */
export interface DenormalizeResult {
  /** Сколько пар (медиафайл, токен) записано/обновлено */
  written: number;
}

/**
 * Нормализует вход в массив пар { tokenId, fileId }, отбрасывая
 * нечисловые tokenId и пустые file_id.
 * @param fileIdsByToken - Карта tokenId → file_id
 * @returns Массив валидных пар
 */
function toTokenRows(
  fileIdsByToken: FileIdsByTokenInput,
): Array<{ tokenId: number; fileId: string }> {
  const rows: Array<{ tokenId: number; fileId: string }> = [];
  for (const [rawTokenId, rawFileId] of Object.entries(fileIdsByToken)) {
    const tokenId = parseInt(rawTokenId, 10);
    const fileId = typeof rawFileId === "string" ? rawFileId.trim() : "";
    if (Number.isNaN(tokenId) || fileId.length === 0) {
      continue;
    }
    rows.push({ tokenId, fileId });
  }
  return rows;
}

/**
 * Денормализует карту fileIdsByToken в таблицу media_file_tokens.
 * Для каждой пары (медиафайл, токен) делает upsert: при конфликте по
 * уникальному индексу обновляет file_id. Невалидные пары игнорируются.
 * @param mediaFileId - ID записи media_files
 * @param fileIdsByToken - Карта tokenId → file_id (из attachedMedia/тела запроса)
 * @returns Кол-во записанных пар
 */
export async function denormalizeFileIdsByToken(
  mediaFileId: number,
  fileIdsByToken: FileIdsByTokenInput,
): Promise<DenormalizeResult> {
  const tokenRows = toTokenRows(fileIdsByToken);
  if (tokenRows.length === 0) {
    return { written: 0 };
  }

  await db
    .insert(mediaFileTokens)
    .values(tokenRows.map((r) => ({ mediaFileId, tokenId: r.tokenId, fileId: r.fileId })))
    .onConflictDoUpdate({
      target: [mediaFileTokens.mediaFileId, mediaFileTokens.tokenId],
      set: { fileId: sql`excluded.file_id` },
    });

  return { written: tokenRows.length };
}
