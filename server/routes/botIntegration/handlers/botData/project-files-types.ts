/**
 * @fileoverview Типы и константы для выдачи файлов проекта (GET /files).
 * Описывает категории-источники, допустимые типы медиа и структуру
 * разобранных query-фильтров для загруженных файлов (media_files).
 * @module botIntegration/handlers/botData/project-files-types
 */

import { MEDIA_TYPES, COVER_TYPE, VALID_SOURCES, VALID_CATEGORIES } from "../../../../../shared/schema/project-file-contracts";
export { MEDIA_TYPES, COVER_TYPE, VALID_SOURCES, VALID_CATEGORIES };
/** Тип медиа. */
export type MediaType = (typeof MEDIA_TYPES)[number];
/** Тип фильтра медиа. */
export type FilterMediaType = MediaType | typeof COVER_TYPE;
/** Источник файла. */
export type FileSource = (typeof VALID_SOURCES)[number];
/** Категория файлов. */
export type FileCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Разобранные фильтры для источника uploaded (media_files).
 * Все поля опциональны; пустые игнорируются при построении условий.
 */
export interface UploadedFileFilters {
  /** Подстрока в имени файла (регистронезависимо, ILIKE) */
  fileName?: string;
  /** Начало диапазона дат создания (Date) */
  dateFrom?: Date;
  /** Конец диапазона дат создания (Date) */
  dateTo?: Date;
  /** Фильтр по типу медиа или обложке */
  mediaType?: FilterMediaType;
  /** ID загрузившего коллаборатора (media_files.uploadedBy) */
  uploadedBy?: number;
  /** Минимальный размер файла в байтах */
  sizeMin?: number;
  /** Максимальный размер файла в байтах */
  sizeMax?: number;
  /** ID конфигурации хранилища (media_files.storageConfigId) */
  storageConfigId?: string;
}

/**
 * Признак того, что заданы фильтры, применимые только к uploaded
 * (uploadedBy, размер, хранилище). Для таких фильтров источники
 * сообщений (incoming/outgoing) в категории «all» исключаются.
 * @param filters - Разобранные фильтры
 * @returns true, если активен хотя бы один uploaded-эксклюзивный фильтр
 */
export function hasUploadedOnlyFilters(filters: UploadedFileFilters): boolean {
  return (
    filters.uploadedBy !== undefined ||
    filters.sizeMin !== undefined ||
    filters.sizeMax !== undefined ||
    filters.storageConfigId !== undefined ||
    filters.mediaType === COVER_TYPE
  );
}
