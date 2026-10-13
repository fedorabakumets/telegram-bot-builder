/**
 * @fileoverview Чтение и поиск пользовательских таблиц через API
 * @module lib/bot-tools/bot-tables-read
 */

import { isTableError, tableRequest, type TableHttpOptions } from './bot-tables-http.ts';

/** Условие поиска строки */
export interface TableRowFilter {
  /** Идентификатор столбца */
  column_id: number;
  /** Оператор белого списка */
  operator: string;
  /** Значение, если оно нужно оператору */
  value?: string;
}

/** Параметры страницы строк */
export interface TableRowQuery {
  /** Условия, не больше пяти */
  filters?: TableRowFilter[];
  /** Предел страницы */
  limit?: number;
  /** Смещение */
  offset?: number;
  /** Сортировка: id, row_index или column:<id> */
  sort?: string;
  /** Какие столбцы оставить в ответе */
  columns?: number[];
}

/**
 * Список таблиц проекта
 * @param projectId - Проект
 * @param options - URL API
 * @returns Массив таблиц или ошибка
 */
export function listTables(projectId: number, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables`, options);
}

/**
 * Поиск таблиц по части имени
 * @param projectId - Проект
 * @param query - Подстрока
 * @param limit - Предел
 * @param options - URL API
 * @returns Найденные таблицы или ошибка
 */
export function findTables(projectId: number, query: string, limit = 50, options?: TableHttpOptions) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return tableRequest(`/api/projects/${projectId}/tables/search?${params}`, options);
}

/**
 * Таблица, столбцы с числовыми идентификаторами и сводка
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Схема или ошибка
 */
export function getTable(projectId: number, tableId: number, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}`, options);
}

/**
 * Столбцы таблицы: имя рядом с числовым идентификатором
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Столбцы или ошибка
 */
export function listColumns(projectId: number, tableId: number, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/columns`, options);
}

/**
 * Страница строк без произвольного SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param query - Фильтры и страница
 * @param options - URL API
 * @returns Страница или ошибка
 */
export function queryRows(projectId: number, tableId: number, query: TableRowQuery, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/rows/query`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
}

/**
 * Одна строка
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param options - URL API
 * @returns Строка или ошибка
 */
export function getRow(projectId: number, tableId: number, rowId: number, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/rows/${rowId}`, options);
}

/**
 * Количество строк по тем же фильтрам
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param filters - Условия
 * @param options - URL API
 * @returns { total } или ошибка
 */
export function countRows(
  projectId: number,
  tableId: number,
  filters: TableRowFilter[] = [],
  options?: TableHttpOptions,
) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/rows/count`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters }),
  });
}

/**
 * Сводка заполненности
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Сводка или ошибка
 */
export function getSummary(projectId: number, tableId: number, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/summary`, options);
}

/**
 * Проверяет, что схема получена, прежде чем писать строки
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Множество идентификаторов столбцов или ошибка
 */
export async function columnIdSet(
  projectId: number,
  tableId: number,
  options?: TableHttpOptions,
): Promise<Set<string> | { error: string }> {
  const columns = await listColumns(projectId, tableId, options);
  if (isTableError(columns) || !Array.isArray(columns)) {
    return isTableError(columns) ? columns : { error: 'Не удалось прочитать столбцы' };
  }
  return new Set(columns.map((column: { id: number }) => String(column.id)));
}
