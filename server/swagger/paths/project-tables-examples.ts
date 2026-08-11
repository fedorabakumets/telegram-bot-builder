/**
 * @fileoverview Примеры JSON для OpenAPI project-tables.
 * @module server/swagger/paths/project-tables-examples
 */

/** Таблица в списке / после create|rename */
export const TABLE_EXAMPLE = {
  id: 1,
  projectId: 42,
  name: "Товары",
  createdAt: "2026-08-01T10:00:00.000Z",
};

/** Список таблиц */
export const TABLES_LIST_EXAMPLE = [TABLE_EXAMPLE];

/** Тело создания таблицы */
export const CREATE_TABLE_BODY_EXAMPLE = { name: "Товары" };

/** Тело переименования таблицы */
export const RENAME_TABLE_BODY_EXAMPLE = { name: "Услуги" };

/** Колонка */
export const COLUMN_EXAMPLE = {
  id: 3,
  tableId: 1,
  name: "Цена",
  position: 0,
};

/** Список колонок */
export const COLUMNS_LIST_EXAMPLE = [
  COLUMN_EXAMPLE,
  { id: 4, tableId: 1, name: "Название", position: 1 },
];

/** Тело создания колонки */
export const CREATE_COLUMN_BODY_EXAMPLE = { name: "Цена", position: 0 };

/** Тело переименования колонки */
export const RENAME_COLUMN_BODY_EXAMPLE = { name: "Стоимость" };

/** Строка */
export const ROW_EXAMPLE = {
  id: 10,
  tableId: 1,
  rowIndex: 0,
  data: { "3": "100", "4": "Товар A" },
};

/** Список строк */
export const ROWS_LIST_EXAMPLE = [ROW_EXAMPLE];

/** Тело батч-создания строк */
export const CREATE_ROWS_BODY_EXAMPLE = {
  rows: [{ rowIndex: 0, data: { "3": "100", "4": "Товар A" } }],
};

/** Тело обновления строки */
export const UPDATE_ROW_BODY_EXAMPLE = {
  data: { "3": "150", "4": "Товар A" },
};

/** Успех delete / reindex */
export const TABLES_SUCCESS_EXAMPLE = { success: true as const };
