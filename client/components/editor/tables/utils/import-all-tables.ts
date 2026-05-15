/**
 * @fileoverview Парсер файла экспорта всех таблиц для импорта
 * @module editor/tables/utils/import-all-tables
 */

/** Формат одной таблицы в файле экспорта */
export interface ImportedTable {
  /** Имя таблицы */
  name: string;
  /** Имена колонок */
  columns: string[];
  /** Строки данных */
  rows: string[][];
}

/** Результат парсинга файла экспорта */
export interface ParseAllTablesResult {
  /** Массив таблиц для импорта */
  tables: ImportedTable[];
}

/**
 * Парсит JSON-файл экспорта всех таблиц
 * @param content - Содержимое JSON-файла
 * @returns Массив таблиц для импорта
 * @throws Error если формат невалидный
 */
export function parseAllTablesExport(content: string): ParseAllTablesResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Невалидный JSON: не удалось распарсить файл');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Ожидается объект с полем "tables"');
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.tables)) {
    throw new Error('Поле "tables" должно быть массивом');
  }

  if (obj.tables.length === 0) {
    throw new Error('Массив таблиц пуст — нет данных для импорта');
  }

  const tables: ImportedTable[] = obj.tables.map((t: unknown, i: number) => {
    if (!t || typeof t !== 'object') {
      throw new Error(`Таблица #${i + 1}: ожидается объект`);
    }
    const table = t as Record<string, unknown>;

    if (typeof table.name !== 'string' || !table.name) {
      throw new Error(`Таблица #${i + 1}: отсутствует имя`);
    }
    if (!Array.isArray(table.columns)) {
      throw new Error(`Таблица "${table.name}": отсутствуют колонки`);
    }
    if (!Array.isArray(table.rows)) {
      throw new Error(`Таблица "${table.name}": отсутствуют строки`);
    }

    return {
      name: table.name as string,
      columns: table.columns as string[],
      rows: table.rows as string[][],
    };
  });

  return { tables };
}
