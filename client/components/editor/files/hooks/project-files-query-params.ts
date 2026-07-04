/**
 * @fileoverview Сериализация категории и фильтров файлов в query-параметры
 * запроса GET /api/projects/:projectId/files. Имена параметров и единицы
 * (размер — в байтах) согласованы с серверным разбором project-files-query-parse.
 * @module components/editor/files/hooks/project-files-query-params
 */

import type { FileMediaType } from './use-project-files';

/** Категория файлов по источнику (Req 5.*) */
export type FileCategory = 'all' | 'incoming' | 'outgoing' | 'uploaded';

/** Единица измерения размера в фильтре (Req 6.7) */
export type SizeUnit = 'KB' | 'MB';

/** Тип медиа в фильтре: типы Telegram + обложка (Req 6.4) */
export type FileFilterMediaType = FileMediaType | 'cover';

/** Состояние фильтров файлов (Req 6.*) */
export interface FileFilters {
  /** Поиск по названию файла (подстрока) */
  fileName?: string;
  /** Начало диапазона дат создания (ISO-строка) */
  dateFrom?: string;
  /** Конец диапазона дат создания (ISO-строка) */
  dateTo?: string;
  /** Тип медиа или обложка; 'all' = без фильтра */
  mediaType?: FileFilterMediaType | 'all';
  /** ID сотрудника-коллаборатора (media_files.uploadedBy) */
  uploadedBy?: number;
  /** Минимальный размер (в единицах sizeUnit) */
  sizeMin?: number;
  /** Максимальный размер (в единицах sizeUnit) */
  sizeMax?: number;
  /** Единица измерения размера (по умолчанию KB) */
  sizeUnit?: SizeUnit;
  /** ID конфигурации хранилища (storage_configs.id); 'all' = без фильтра */
  storageConfigId?: string | 'all';
}

/** Множители перевода единиц размера в байты */
const SIZE_UNIT_BYTES: Record<SizeUnit, number> = {
  KB: 1024,
  MB: 1024 * 1024,
};

/**
 * Переводит значение размера из выбранной единицы в байты для сервера.
 * @param value - Значение размера в единицах unit
 * @param unit - Единица измерения (KB/MB), по умолчанию KB
 * @returns Размер в байтах (целое) или undefined для пустого значения
 */
function toBytes(value: number | undefined, unit: SizeUnit | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined;
  return Math.floor(value * SIZE_UNIT_BYTES[unit ?? 'KB']);
}

/** Входные данные сериализатора query-параметров */
export interface FilesQueryInput {
  /** Категория-источник */
  category: FileCategory;
  /** Расширенные фильтры */
  filters?: FileFilters;
  /** Фильтр по токену бота */
  tokenId?: number | null;
  /** Номер страницы (1..) */
  page?: number;
  /** Размер страницы */
  limit?: number;
}

/**
 * Строит URLSearchParams для запроса файлов проекта из категории и фильтров.
 * Пустые/служебные значения ('all', undefined) опускаются; размер переводится
 * в байты согласно sizeUnit, как ожидает сервер.
 * @param input - Категория, фильтры, токен и пагинация
 * @returns Готовые query-параметры для запроса
 */
export function buildFilesQueryParams({ category, filters, tokenId, page = 1, limit = 50 }: FilesQueryInput): URLSearchParams {
  const params = new URLSearchParams({ category, page: String(page), limit: String(limit) });
  if (tokenId) params.set('tokenId', String(tokenId));

  const f = filters ?? {};
  if (f.fileName?.trim()) params.set('fileName', f.fileName.trim());
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  if (f.mediaType && f.mediaType !== 'all') params.set('mediaType', f.mediaType);
  if (f.uploadedBy !== undefined) params.set('uploadedBy', String(f.uploadedBy));

  const sizeMin = toBytes(f.sizeMin, f.sizeUnit);
  const sizeMax = toBytes(f.sizeMax, f.sizeUnit);
  if (sizeMin !== undefined) params.set('sizeMin', String(sizeMin));
  if (sizeMax !== undefined) params.set('sizeMax', String(sizeMax));

  if (f.storageConfigId && f.storageConfigId !== 'all') params.set('storageConfigId', f.storageConfigId);

  return params;
}
