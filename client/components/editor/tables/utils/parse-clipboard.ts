/**
 * @fileoverview Парсер Tab-separated данных из буфера обмена (Excel/Google Sheets)
 * @module editor/tables/utils/parse-clipboard
 */

/** Результат парсинга TSV из буфера */
interface ParseClipboardResult {
  /** Имена колонок (null если первая строка — данные, не заголовки) */
  columns: string[] | null;
  /** Строки данных */
  rows: string[][];
}

/**
 * Парсит Tab-separated текст из буфера обмена
 * @param text - Текст из clipboard (Tab-separated)
 * @returns Объект с колонками (или null) и строками
 */
export function parseClipboardTsv(text: string): ParseClipboardResult {
  const normalized = text.replace(/\r\n/g, '\n').trimEnd();
  if (!normalized) {
    return { columns: null, rows: [] };
  }

  const lines = normalized.split('\n');
  const allRows = lines.map((line) => line.split('\t'));

  if (allRows.length === 0) {
    return { columns: null, rows: [] };
  }

  const firstRow = allRows[0];
  const isHeader = detectHeader(firstRow);

  if (isHeader && allRows.length > 1) {
    return { columns: firstRow, rows: allRows.slice(1) };
  }

  return { columns: null, rows: allRows };
}

/**
 * Определяет, является ли первая строка заголовком (не числа)
 * @param row - Первая строка данных
 * @returns true если строка выглядит как заголовки
 */
function detectHeader(row: string[]): boolean {
  if (row.length === 0) return false;
  /** Если все значения — числа, это данные, не заголовки */
  const allNumeric = row.every((cell) => /^\d+([.,]\d+)?$/.test(cell.trim()));
  return !allNumeric;
}
