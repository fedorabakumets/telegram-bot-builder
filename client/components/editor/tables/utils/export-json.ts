/**
 * @fileoverview Утилита экспорта таблицы в формат JSON
 * @module editor/tables/utils/export-json
 */

import type { TableColumn, TableRow } from '../types';

/**
 * Конвертирует данные таблицы в JSON-строку (массив объектов)
 * @param columns - Колонки таблицы
 * @param rows - Строки таблицы
 * @returns Строка JSON с отступом 2 пробела
 */
export function tableToJson(columns: TableColumn[], rows: TableRow[]): string {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const col of columns) {
      obj[col.name] = row.cells[col.id] ?? '';
    }
    return obj;
  });

  return JSON.stringify(data, null, 2);
}
