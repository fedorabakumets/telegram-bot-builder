/**
 * @fileoverview Изменения таблиц. Удаление не уходит в сеть без confirm
 * @module lib/bot-tools/bot-tables-write
 */

import { isTableError, tableRequest, type TableHttpOptions } from './bot-tables-http.ts';
import { columnIdSet } from './bot-tables-read.ts';
import { MAX_ADD_ROWS } from './bot-tables-limits.ts';

/** Опции с подтверждением */
export interface ConfirmOptions extends TableHttpOptions {
  /** Явное согласие на необратимое действие */
  confirm?: boolean;
}

const NEED_CONFIRM = 'Операция необратима. Передайте confirm: true.';

/**
 * Создаёт таблицу
 * @param projectId - Проект
 * @param name - Имя
 * @param options - URL API
 * @returns Таблица или ошибка
 */
export function createTable(projectId: number, name: string, options?: TableHttpOptions) {
  return send(projectId, '', 'POST', { name }, options);
}

/**
 * Переименовывает таблицу
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param name - Новое имя
 * @param options - URL API
 * @returns Таблица или ошибка
 */
export function renameTable(projectId: number, tableId: number, name: string, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}`, 'PUT', { name }, options);
}

/**
 * Удаляет таблицу только после подтверждения
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - Подтверждение
 * @returns Успех или ошибка
 */
export function deleteTable(projectId: number, tableId: number, options?: ConfirmOptions) {
  if (options?.confirm !== true) return Promise.resolve({ error: NEED_CONFIRM });
  return send(projectId, `/${tableId}`, 'DELETE', undefined, options);
}

/**
 * Добавляет столбец
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param name - Имя
 * @param position - Позиция
 * @param options - URL API
 * @returns Столбец или ошибка
 */
export function addColumn(projectId: number, tableId: number, name: string, position: number | undefined, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/columns`, 'POST', { name, position }, options);
}

/**
 * Переименовывает столбец
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnId - Столбец
 * @param name - Имя
 * @param options - URL API
 * @returns Столбец или ошибка
 */
export function renameColumn(projectId: number, tableId: number, columnId: number, name: string, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/columns/${columnId}`, 'PUT', { name }, options);
}

/**
 * Удаляет столбец после подтверждения
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnId - Столбец
 * @param options - Подтверждение
 * @returns Успех или ошибка
 */
export function deleteColumn(projectId: number, tableId: number, columnId: number, options?: ConfirmOptions) {
  if (options?.confirm !== true) return Promise.resolve({ error: NEED_CONFIRM });
  return send(projectId, `/${tableId}/columns/${columnId}`, 'DELETE', undefined, options);
}

/**
 * Меняет порядок столбцов
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnIds - Полный список
 * @param options - URL API
 * @returns Столбцы или ошибка
 */
export function reorderColumns(projectId: number, tableId: number, columnIds: number[], options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/columns/reorder`, 'PUT', { column_ids: columnIds }, options);
}

/**
 * Добавляет не больше 200 строк и сверяет ключи со схемой
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rows - Строки
 * @param options - URL API
 * @returns Строки или ошибка
 */
export async function addRows(
  projectId: number,
  tableId: number,
  rows: Array<{ row_index?: number; data: Record<string, string> }>,
  options?: TableHttpOptions,
) {
  if (rows.length === 0 || rows.length > MAX_ADD_ROWS) return { error: `От 1 до ${MAX_ADD_ROWS} строк` };
  const ids = await columnIdSet(projectId, tableId, options);
  if (isTableError(ids)) return ids;
  for (const row of rows) {
    const unknown = Object.keys(row.data).find((key) => !ids.has(key));
    if (unknown) return { error: `Неизвестный столбец: ${unknown}` };
  }
  return send(projectId, `/${tableId}/rows`, 'POST', {
    rows: rows.map((row) => ({ rowIndex: row.row_index, data: row.data })),
  }, options);
}

/**
 * Полностью заменяет строку
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param data - Ячейки
 * @param options - URL API
 * @returns Строка или ошибка
 */
export function updateRow(projectId: number, tableId: number, rowId: number, data: Record<string, string>, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/rows/${rowId}`, 'PUT', { data }, options);
}

/**
 * Объединяет ячейки строки
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param data - Изменённые ячейки
 * @param options - URL API
 * @returns Строка или ошибка
 */
export function patchRow(projectId: number, tableId: number, rowId: number, data: Record<string, string>, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/rows/${rowId}`, 'PATCH', { data }, options);
}

/**
 * Удаляет строку после подтверждения
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param options - Подтверждение
 * @returns Успех или ошибка
 */
export function deleteRow(projectId: number, tableId: number, rowId: number, options?: ConfirmOptions) {
  if (options?.confirm !== true) return Promise.resolve({ error: NEED_CONFIRM });
  return send(projectId, `/${tableId}/rows/${rowId}`, 'DELETE', undefined, options);
}

/**
 * Перенумеровывает строки
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Успех или ошибка
 */
export function reindexRows(projectId: number, tableId: number, options?: TableHttpOptions) {
  return send(projectId, `/${tableId}/rows/reindex`, 'POST', {}, options);
}

/**
 * Очищает строки после подтверждения
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - Подтверждение
 * @returns Успех или ошибка
 */
export function clearRows(projectId: number, tableId: number, options?: ConfirmOptions) {
  if (options?.confirm !== true) return Promise.resolve({ error: NEED_CONFIRM });
  return send(projectId, `/${tableId}/rows`, 'DELETE', { confirm: true }, options);
}

/**
 * Импортирует пакет строк
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param mode - append или replace
 * @param rows - Ячейки по идентификаторам столбцов
 * @param options - Подтверждение для replace
 * @returns Строки или ошибка
 */
export async function importRows(
  projectId: number,
  tableId: number,
  mode: 'append' | 'replace',
  rows: Array<Record<string, string>>,
  options?: ConfirmOptions,
) {
  if (mode === 'replace' && options?.confirm !== true) return { error: NEED_CONFIRM };
  if (rows.length === 0 || rows.length > MAX_ADD_ROWS) return { error: `От 1 до ${MAX_ADD_ROWS} строк` };
  const ids = await columnIdSet(projectId, tableId, options);
  if (isTableError(ids)) return ids;
  for (const row of rows) {
    const unknown = Object.keys(row).find((key) => !ids.has(key));
    if (unknown) return { error: `Неизвестный столбец: ${unknown}` };
  }
  return send(projectId, `/${tableId}/rows/import`, 'POST', { mode, confirm: options?.confirm === true, rows }, options);
}

/**
 * Отправляет JSON в маршрут таблиц
 * @param projectId - Проект
 * @param suffix - Хвост пути
 * @param method - Метод
 * @param body - Тело
 * @param options - URL API
 * @returns Ответ или ошибка
 */
function send(projectId: number, suffix: string, method: string, body: unknown, options?: TableHttpOptions) {
  return tableRequest(`/api/projects/${projectId}/tables${suffix}`, {
    ...options,
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
