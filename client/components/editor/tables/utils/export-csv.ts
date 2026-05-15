/**
 * @fileoverview Утилита экспорта таблицы в формат CSV
 * @module editor/tables/utils/export-csv
 */

import type { TableColumn, TableRow } from '../types';

/**
 * Экранирует значение для CSV — оборачивает в кавычки при необходимости
 * @param value - Исходное значение ячейки
 * @returns Экранированное значение
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Конвертирует данные таблицы в строку CSV
 * @param columns - Колонки таблицы
 * @param rows - Строки таблицы
 * @returns Строка в формате CSV
 */
export function tableToCsv(columns: TableColumn[], rows: TableRow[]): string {
  const header = columns.map((col) => escapeCsvValue(col.name)).join(',');

  const body = rows.map((row) =>
    columns
      .map((col) => escapeCsvValue(row.cells[col.id] ?? ''))
      .join(',')
  );

  return [header, ...body].join('\n');
}
