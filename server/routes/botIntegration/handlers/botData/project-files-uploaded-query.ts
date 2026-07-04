/**
 * @fileoverview Запрос загруженных файлов (media_files) с фильтрами и
 * обогащением: extension, uploadedBy, storageBackend/storageConfigId,
 * storageName и fileIdsByToken (Req 5.5, 6.*, 7.*, 8.2, 8.3).
 * @module botIntegration/handlers/botData/project-files-uploaded-query
 */

import { desc, sql } from "drizzle-orm";

import { db } from "../../../../database/db";
import { mediaFiles } from "@shared/schema";
import { buildUploadedConditions } from "./project-files-filters";
import { deriveExtension } from "./project-files-extension";
import { buildFileIdsByTokenMap, type FileIdsByToken } from "./project-files-tokens";
import { loadStorageNameMap, resolveStorageName } from "./project-files-storage-names";
import type { UploadedFileFilters } from "./project-files-types";

/** Элемент выдачи загруженного файла */
export interface UploadedFileDTO {
  /** Внутренний ID записи media_files */
  id: number;
  /** Источник файла */
  source: "uploaded";
  /** Тип медиа (media_files.fileType) */
  mediaType: string;
  /** Кэшированный Telegram file_id (по умолчанию) */
  fileId: string | null;
  /** Имя файла */
  fileName: string;
  /** Размер в байтах */
  fileSize: number;
  /** Длительность (для media_files не хранится) */
  duration: null;
  /** URL/JSON-метаданные доступа к файлу */
  url: string;
  /** Расширение файла (из имени или по типу) */
  extension: string | null;
  /** ID загрузившего коллаборатора */
  uploadedBy: number | null;
  /** Тип бэкенда хранилища */
  storageBackend: string;
  /** ID конфигурации хранилища */
  storageConfigId: string | null;
  /** Человекочитаемое имя хранилища */
  storageName: string;
  /** Карта tokenId → file_id из media_file_tokens */
  fileIdsByToken: FileIdsByToken;
  /** Дата создания */
  createdAt: Date | null;
}

/**
 * Запрашивает загруженные файлы проекта с применением фильтров и
 * обогащает их новыми полями выдачи.
 * @param projectId - ID проекта
 * @param filters - Разобранные фильтры
 * @param limit - Лимит записей
 * @param offset - Смещение для пагинации
 * @returns Список файлов и общее число записей
 */
export async function queryUploadedFiles(
  projectId: number,
  filters: UploadedFileFilters,
  limit: number,
  offset: number,
): Promise<{ files: UploadedFileDTO[]; total: number }> {
  const where = buildUploadedConditions(projectId, filters);

  const [rows, countResult] = await Promise.all([
    db.select().from(mediaFiles).where(where).orderBy(desc(mediaFiles.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(mediaFiles).where(where),
  ]);

  const [tokenMap, storageMap] = await Promise.all([
    buildFileIdsByTokenMap(rows.map((r) => r.id)),
    loadStorageNameMap(),
  ]);

  const files: UploadedFileDTO[] = rows.map((row) => ({
    id: row.id,
    source: "uploaded",
    mediaType: row.fileType,
    fileId: row.telegramFileId ?? null,
    fileName: row.fileName,
    fileSize: row.fileSize,
    duration: null,
    url: row.url,
    extension: deriveExtension(row.fileName, row.fileType),
    uploadedBy: row.uploadedBy ?? null,
    storageBackend: row.storageBackend,
    storageConfigId: row.storageConfigId ?? null,
    storageName: resolveStorageName(row.storageConfigId, row.storageBackend, storageMap),
    fileIdsByToken: tokenMap[row.id] ?? {},
    createdAt: row.createdAt,
  }));

  return { files, total: countResult[0]?.count ?? 0 };
}
