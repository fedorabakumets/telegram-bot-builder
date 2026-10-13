/**
 * @fileoverview Общий JSON версии 1 со всеми таблицами проекта
 * @module shared/tables/io/all-tables
 */

import type { AllTablesExport, ExportedTable } from "./types";

/**
 * Собирает файл версии 1
 * @param tables - Таблицы
 * @param exportedAt - Момент выгрузки
 * @returns Объект файла
 */
export function buildAllTablesExport(tables: ExportedTable[], exportedAt: string): AllTablesExport {
  return { version: 1, exportedAt, tables };
}

/**
 * Разбирает общий JSON версии 1
 * @param content - Текст файла
 * @returns Таблицы для импорта
 */
export function parseAllTablesExport(content: string): { tables: ExportedTable[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Невалидный JSON: не удалось распарсить файл");
  }
  if (!parsed || typeof parsed !== "object") throw new Error('Ожидается объект с полем "tables"');
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== undefined && obj.version !== 1) throw new Error("Поддерживается только версия 1");
  if (!Array.isArray(obj.tables)) throw new Error('Поле "tables" должно быть массивом');
  if (obj.tables.length === 0) throw new Error("Массив таблиц пуст — нет данных для импорта");
  const tables = obj.tables.map((item, i) => parseOne(item, i));
  return { tables };
}

/**
 * Проверяет одну таблицу в файле
 * @param item - Элемент массива
 * @param index - Индекс с нуля
 * @returns Таблица
 */
function parseOne(item: unknown, index: number): ExportedTable {
  if (!item || typeof item !== "object") throw new Error(`Таблица #${index + 1}: ожидается объект`);
  const table = item as Record<string, unknown>;
  if (typeof table.name !== "string" || !table.name) throw new Error(`Таблица #${index + 1}: отсутствует имя`);
  if (!Array.isArray(table.columns) || table.columns.some((c) => typeof c !== "string")) {
    throw new Error(`Таблица "${table.name}": отсутствуют колонки`);
  }
  if (!Array.isArray(table.rows)) throw new Error(`Таблица "${table.name}": отсутствуют строки`);
  const rows = table.rows.map((row) => {
    if (!Array.isArray(row) || row.some((cell) => typeof cell !== "string" && typeof cell !== "number")) {
      throw new Error(`Таблица "${table.name}": строка должна быть массивом значений`);
    }
    return row.map((cell) => String(cell));
  });
  return { name: table.name, columns: table.columns as string[], rows };
}
