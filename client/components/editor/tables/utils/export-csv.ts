/**
 * @fileoverview Утилита экспорта таблицы в формат CSV
 * @module editor/tables/utils/export-csv
 */

import { tableToCsv as rowsToCsv } from "@shared/tables/io";
import type { TableColumn, TableRow } from "../types";

/**
 * Конвертирует данные таблицы в строку CSV
 * @param columns - Колонки таблицы
 * @param rows - Строки таблицы
 * @returns Строка в формате CSV
 */
export function tableToCsv(columns: TableColumn[], rows: TableRow[]): string {
  return rowsToCsv(columns, rows);
}
