/**
 * @fileoverview Утилита экспорта таблицы в формат JSON
 * @module editor/tables/utils/export-json
 */

import { tableToJson as rowsToJson } from "@shared/tables/io";
import type { TableColumn, TableRow } from "../types";

/**
 * Конвертирует данные таблицы в JSON-строку (массив объектов)
 * @param columns - Колонки таблицы
 * @param rows - Строки таблицы
 * @returns Строка JSON с отступом 2 пробела
 */
export function tableToJson(columns: TableColumn[], rows: TableRow[]): string {
  return rowsToJson(columns, rows);
}
