/**
 * @fileoverview Утилита копирования таблицы в буфер обмена (Tab-separated)
 * @module editor/tables/utils/export-clipboard
 */

import type { TableColumn, TableRow } from '../types';

/**
 * Копирует данные таблицы в буфер обмена в формате TSV
 * (Tab-separated values — для вставки в Google Sheets / Excel)
 * @param columns - Колонки таблицы
 * @param rows - Строки таблицы
 * @returns Promise, который резолвится после копирования
 */
export async function tableToClipboard(
  columns: TableColumn[],
  rows: TableRow[]
): Promise<void> {
  const header = columns.map((col) => col.name).join('\t');

  const body = rows.map((row) =>
    columns.map((col) => row.cells[col.id] ?? '').join('\t')
  );

  const tsv = [header, ...body].join('\n');

  await navigator.clipboard.writeText(tsv);
}
