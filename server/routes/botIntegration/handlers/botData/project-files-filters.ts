/**
 * @fileoverview Построение drizzle-условий фильтрации для загруженных файлов
 * (media_files): fileName (ILIKE), диапазон дат, тип медиа/обложка,
 * uploadedBy, диапазон размера, storageConfigId.
 * @module botIntegration/handlers/botData/project-files-filters
 */

import { and, eq, gte, ilike, isNotNull, lte, or, type SQL } from "drizzle-orm";

import { mediaFiles } from "@shared/schema";
import { COVER_TYPE, type UploadedFileFilters } from "./project-files-types";

/**
 * Строит условия фильтрации для таблицы media_files (источник uploaded).
 * @param projectId - ID проекта
 * @param filters - Разобранные фильтры
 * @returns Объединённое условие drizzle (and)
 */
export function buildUploadedConditions(projectId: number, filters: UploadedFileFilters): SQL | undefined {
  const conditions: SQL[] = [eq(mediaFiles.projectId, projectId)];

  if (filters.fileName) {
    conditions.push(ilike(mediaFiles.fileName, `%${filters.fileName}%`));
  }
  if (filters.dateFrom) {
    conditions.push(gte(mediaFiles.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(mediaFiles.createdAt, filters.dateTo));
  }
  if (filters.mediaType === COVER_TYPE) {
    const coverCond = or(isNotNull(mediaFiles.thumbnailUrl), isNotNull(mediaFiles.thumbnailMediaId));
    if (coverCond) conditions.push(coverCond);
  } else if (filters.mediaType) {
    conditions.push(eq(mediaFiles.fileType, filters.mediaType));
  }
  if (filters.uploadedBy !== undefined) {
    conditions.push(eq(mediaFiles.uploadedBy, filters.uploadedBy));
  }
  if (filters.sizeMin !== undefined) {
    conditions.push(gte(mediaFiles.fileSize, filters.sizeMin));
  }
  if (filters.sizeMax !== undefined) {
    conditions.push(lte(mediaFiles.fileSize, filters.sizeMax));
  }
  if (filters.storageConfigId !== undefined) {
    conditions.push(eq(mediaFiles.storageConfigId, filters.storageConfigId));
  }

  return and(...conditions);
}
