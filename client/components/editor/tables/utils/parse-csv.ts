/**
 * @fileoverview Парсер CSV-файлов для импорта данных в таблицы
 * @module editor/tables/utils/parse-csv
 */

/** Результат парсинга CSV */
interface ParseCsvResult {
  /** Имена колонок (из первой строки) */
  columns: string[];
  /** Строки данных (массив массивов значений) */
  rows: string[][];
}

/**
 * Парсит CSV-строку с поддержкой кавычек, запятых и переносов внутри значений
 * @param content - Содержимое CSV-файла
 * @returns Объект с колонками и строками
 */
export function parseCsv(content: string): ParseCsvResult {
  const lines = parseCsvLines(content);
  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }
  const columns = lines[0];
  const rows = lines.slice(1);
  return { columns, rows };
}

/**
 * Разбирает CSV-контент на массив строк (каждая строка — массив значений)
 * @param content - Сырой текст CSV
 * @returns Двумерный массив значений
 */
function parseCsvLines(content: string): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let value = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          value += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        value += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(value);
        value = '';
        i++;
      } else if (ch === '\r' && content[i + 1] === '\n') {
        current.push(value);
        value = '';
        result.push(current);
        current = [];
        i += 2;
      } else if (ch === '\n') {
        current.push(value);
        value = '';
        result.push(current);
        current = [];
        i++;
      } else {
        value += ch;
        i++;
      }
    }
  }

  if (value || current.length > 0) {
    current.push(value);
    result.push(current);
  }

  return result;
}
