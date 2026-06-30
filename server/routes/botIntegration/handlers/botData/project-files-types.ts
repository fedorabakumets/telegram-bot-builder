/**
 * @fileoverview Типы и константы для выдачи файлов проекта (GET /files).
 * Описывает категории-источники, допустимые типы медиа и структуру
 * разобранных query-фильтров для загруженных файлов (media_files).
 * @module botIntegration/handlers/botData/project-files-types
 */

/** Допустимые типы медиа для фильтрации */
export const MEDIA_TYPES = [
  "photo",
  "video",
  "animation",
  "audio",
  "voice",
  "video_note",
  "document",
  "sticker",
] as const;

/** Тип медиа (один из MEDIA_TYPES) */
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Специальный тип-фильтр «обложка/превью» (thumbnail) — Req 6.4 */
export const COVER_TYPE = "cover" as const;

/** Допустимые значения фильтра по типу: медиа-типы + обложка */
export type FilterMediaType = MediaType | typeof COVER_TYPE;

/** Допустимые источники файлов (легаси-параметр source) */
export const VALID_SOURCES = ["incoming", "outgoing", "uploaded"] as const;

/** Источник файла */
export type FileSource = (typeof VALID_SOURCES)[number];

/** Допустимые категории (новый параметр category) */
export const VALID_CATEGORIES = ["all", "incoming", "outgoing", "uploaded"] as const;

/** Категория файлов по источнику */
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
