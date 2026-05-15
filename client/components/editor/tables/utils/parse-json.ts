/**
 * @fileoverview Парсер JSON-файлов (массив объектов) для импорта в таблицы
 * @module editor/tables/utils/parse-json
 */

/** Результат парсинга JSON */
interface ParseJsonResult {
  /** Имена колонок (уникальные ключи из всех объектов) */
  columns: string[];
  /** Строки данных (значения приведены к строке) */
  rows: string[][];
}

/**
 * Парсит JSON-строку (массив объектов) в табличный формат
 * @param content - Содержимое JSON-файла
 * @returns Объект с колонками и строками
 * @throws Error если формат не массив объектов или массив пуст
 */
export function parseJsonTable(content: string): ParseJsonResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Невалидный JSON: не удалось распарсить файл');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Ожидается массив объектов, получен другой тип');
  }

  if (parsed.length === 0) {
    throw new Error('Массив пуст — нет данных для импорта');
  }

  /** Собираем уникальные ключи из всех объектов (union) */
  const columnsSet = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('Каждый элемент массива должен быть объектом');
    }
    for (const key of Object.keys(item)) {
      columnsSet.add(key);
    }
  }

  const columns = Array.from(columnsSet);

  /** Маппим значения в строки */
  const rows: string[][] = parsed.map((item: Record<string, unknown>) =>
    columns.map((col) => {
      const val = item[col];
      return val === undefined || val === null ? '' : String(val);
    }),
  );

  return { columns, rows };
}
