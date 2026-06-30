/**
 * @fileoverview Разбор и валидация query-параметров GET /files.
 * Параметр category имеет приоритет над легаси-параметром source.
 * Невалидные значения возвращаются как ошибка для ответа 400.
 * @module botIntegration/handlers/botData/project-files-query-parse
 */

import type { Request } from "express";

import {
  COVER_TYPE,
  MEDIA_TYPES,
  VALID_CATEGORIES,
  VALID_SOURCES,
  type FileCategory,
  type FilterMediaType,
  type UploadedFileFilters,
} from "./project-files-types";

/** Результат разбора query-параметров */
export interface ParsedProjectFilesQuery {
  /** Категория-источник (all/incoming/outgoing/uploaded) */
  category: FileCategory;
  /** Фильтр по токену бота (для сообщений) */
  tokenId?: number;
  /** Номер страницы (1..) */
  page: number;
  /** Размер страницы (1..100) */
  limit: number;
  /** Смещение для пагинации */
  offset: number;
  /** Разобранные фильтры для uploaded */
  filters: UploadedFileFilters;
}

/** Унифицированный результат разбора: успех или ошибка валидации */
export type ParseResult =
  | { ok: true; value: ParsedProjectFilesQuery }
  | { ok: false; error: string };

/**
 * Парсит дату из строки; undefined для пустой строки, null для некорректной.
 * @param raw - Строковое значение даты (ISO)
 */
function parseDate(raw: string | undefined): Date | null | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Парсит неотрицательное целое; undefined для пустого, null для некорректного.
 * @param raw - Строковое значение
 */
function parseNonNegInt(raw: string | undefined): number | null | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Разбирает и валидирует query-параметры запроса файлов проекта.
 * @param req - HTTP-запрос Express
 * @returns Результат разбора (value или error)
 */
export function parseProjectFilesQuery(req: Request): ParseResult {
  const rawCategory = (req.query.category as string) || (req.query.source as string);
  if (!rawCategory) {
    return { ok: false, error: "Параметр category обязателен: all | incoming | outgoing | uploaded" };
  }
  if (![...VALID_CATEGORIES, ...VALID_SOURCES].includes(rawCategory)) {
    return { ok: false, error: "Неверный category. Допустимые: all | incoming | outgoing | uploaded" };
  }
  const category = rawCategory as FileCategory;

  const rawType = (req.query.mediaType as string | undefined) ?? (req.query.type as string | undefined);
  let mediaType: FilterMediaType | undefined;
  if (rawType) {
    if (rawType !== COVER_TYPE && !MEDIA_TYPES.includes(rawType as never)) {
      return { ok: false, error: `Неверный mediaType. Допустимые: ${[...MEDIA_TYPES, COVER_TYPE].join(", ")}` };
    }
    mediaType = rawType as FilterMediaType;
  }

  const dateFrom = parseDate(req.query.dateFrom as string | undefined);
  const dateTo = parseDate(req.query.dateTo as string | undefined);
  if (dateFrom === null || dateTo === null) {
    return { ok: false, error: "Неверный формат dateFrom/dateTo (ожидается ISO-дата)" };
  }
  if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
    return { ok: false, error: "dateFrom не может быть позже dateTo" };
  }

  const sizeMin = parseNonNegInt(req.query.sizeMin as string | undefined);
  const sizeMax = parseNonNegInt(req.query.sizeMax as string | undefined);
  if (sizeMin === null || sizeMax === null) {
    return { ok: false, error: "Неверные sizeMin/sizeMax (ожидается неотрицательное число)" };
  }
  if (sizeMin !== undefined && sizeMax !== undefined && sizeMin > sizeMax) {
    return { ok: false, error: "sizeMin не может быть больше sizeMax" };
  }

  const uploadedBy = parseNonNegInt(req.query.uploadedBy as string | undefined);
  if (uploadedBy === null) {
    return { ok: false, error: "Неверный uploadedBy" };
  }

  const storageRaw = req.query.storageConfigId as string | undefined;
  const storageConfigId = storageRaw && storageRaw !== "all" ? storageRaw : undefined;

  const tokenIdRaw = req.query.tokenId ? parseInt(req.query.tokenId as string, 10) : undefined;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));

  return {
    ok: true,
    value: {
      category,
      tokenId: tokenIdRaw !== undefined && !isNaN(tokenIdRaw) ? tokenIdRaw : undefined,
      page,
      limit,
      offset: (page - 1) * limit,
      filters: {
        fileName: (req.query.fileName as string | undefined)?.trim() || undefined,
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? undefined,
        mediaType,
        uploadedBy,
        sizeMin,
        sizeMax,
        storageConfigId,
      },
    },
  };
}
