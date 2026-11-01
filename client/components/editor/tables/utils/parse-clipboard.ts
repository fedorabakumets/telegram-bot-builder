/** @fileoverview Разбор диапазона из Excel и Google Таблиц без угадывания строки заголовков. */
/** Результат разбора диапазона. */
interface ParseClipboardResult {
  /** Диапазон не содержит автоматически определяемых заголовков. */
  columns: null;
  /** Все строки, включая первую и пустые ячейки. */
  rows: string[][];
}
/**
 * Разбирает TSV с кавычками, переносами внутри ячейки и завершающими пустыми столбцами.
 * @param text - Содержимое буфера обмена.
 * @returns Исходный прямоугольный диапазон без потери первой строки.
 */
export function parseClipboardTsv(text: string): ParseClipboardResult {
  if (!text) return { columns: null, rows: [] };
  const rows: string[][] = [];
  let row: string[] = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"' && (quoted || value === '')) {
      if (quoted && text[index + 1] === '"') { value += '"'; index++; } else quoted = !quoted;
    } else if (!quoted && character === '\t') { row.push(value); value = ''; }
    else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index++;
      row.push(value); rows.push(row); row = []; value = '';
    } else value += character;
  }
  if (value !== '' || row.length || !/[\r\n]$/.test(text)) { row.push(value); rows.push(row); }
  if (quoted) throw new Error('Не закрыты кавычки в диапазоне');
  return { columns: null, rows };
}
