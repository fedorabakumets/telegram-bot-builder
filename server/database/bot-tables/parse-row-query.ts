/**
 * @fileoverview Разбор тела ограниченного запроса строк
 * @module server/database/bot-tables/parse-row-query
 */

import type { RowFilter, RowSort } from "./compile-row-query";
import { DEFAULT_ROW_LIMIT, MAX_FILTER_VALUE, MAX_FILTERS, MAX_ROW_LIMIT } from "./limits";

/** Успешный разбор */
export interface ParsedRowQuery {
  /** Условия */
  filters: RowFilter[];
  /** Сортировка */
  sort: RowSort;
  /** Предел */
  limit: number;
  /** Смещение */
  offset: number;
  /** Выбранные столбцы или null */
  columnIds: number[] | null;
}

const OPERATORS = new Set([
  "equals", "not_equals", "contains", "starts_with", "ends_with",
  "filled", "empty", "greater_than", "less_than",
]);

/**
 * Разбирает тело POST …/rows/query
 * @param body - JSON
 * @param allowed - Идентификаторы столбцов таблицы
 * @returns Запрос или текст ошибки
 */
export function parseRowQuery(body: unknown, allowed: ReadonlySet<number>): ParsedRowQuery | { message: string } {
  const source = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const filters = parseFilters(source.filters, allowed);
  if ("message" in filters) return filters;
  const sort = parseSort(source.sort, allowed);
  if ("message" in sort) return sort;
  const limit = source.limit === undefined ? DEFAULT_ROW_LIMIT : source.limit;
  const offset = source.offset === undefined ? 0 : source.offset;
  if (!isBoundedInt(limit, 1, MAX_ROW_LIMIT)) return { message: `limit от 1 до ${MAX_ROW_LIMIT}` };
  if (!isBoundedInt(offset, 0, 1_000_000)) return { message: "Некорректный offset" };
  const columnIds = parseColumns(source.columns, allowed);
  if (columnIds && "message" in columnIds) return columnIds;
  return { filters, sort, limit, offset, columnIds: columnIds ?? null };
}

/**
 * Проверяет целое в диапазоне
 * @param value - Значение
 * @param min - Минимум
 * @param max - Максимум
 * @returns Признак допустимости
 */
function isBoundedInt(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Разбирает фильтры
 * @param input - Массив
 * @param allowed - Столбцы
 * @returns Фильтры или ошибка
 */
function parseFilters(input: unknown, allowed: ReadonlySet<number>): RowFilter[] | { message: string } {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > MAX_FILTERS) return { message: `Не больше ${MAX_FILTERS} условий` };
  const filters: RowFilter[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return { message: "Некорректное условие" };
    const filter = item as Record<string, unknown>;
    const columnId = filter.column_id;
    if (typeof columnId !== "number" || !allowed.has(columnId)) return { message: "Столбец условия не принадлежит таблице" };
    if (typeof filter.operator !== "string" || !OPERATORS.has(filter.operator)) return { message: "Недопустимый оператор" };
    const needsValue = filter.operator !== "filled" && filter.operator !== "empty";
    if (needsValue && (typeof filter.value !== "string" || filter.value.length > MAX_FILTER_VALUE)) {
      return { message: "Значение условия должно быть строкой ограниченной длины" };
    }
    filters.push({
      columnId,
      operator: filter.operator as RowFilter["operator"],
      value: typeof filter.value === "string" ? filter.value : undefined,
    });
  }
  return filters;
}

/**
 * Разбирает сортировку
 * @param input - Поле sort
 * @param allowed - Столбцы
 * @returns Сортировка или ошибка
 */
function parseSort(input: unknown, allowed: ReadonlySet<number>): RowSort | { message: string } {
  if (input === undefined || input === "row_index") return { kind: "row_index" };
  if (input === "id") return { kind: "id" };
  if (typeof input === "string" && input.startsWith("column:")) {
    const columnId = Number(input.slice("column:".length));
    if (!allowed.has(columnId)) return { message: "Сортировка по чужому столбцу" };
    return { kind: "column", columnId };
  }
  return { message: "Сортировка: id, row_index или column:<id>" };
}

/**
 * Разбирает выбор столбцов
 * @param input - Массив идентификаторов
 * @param allowed - Столбцы
 * @returns Список, null или ошибка
 */
function parseColumns(input: unknown, allowed: ReadonlySet<number>): number[] | null | { message: string } {
  if (input === undefined) return null;
  if (!Array.isArray(input) || input.length > 100) return { message: "Некорректный список столбцов" };
  const ids: number[] = [];
  for (const id of input) {
    if (typeof id !== "number" || !allowed.has(id)) return { message: "В выборке есть чужой столбец" };
    ids.push(id);
  }
  return ids;
}
