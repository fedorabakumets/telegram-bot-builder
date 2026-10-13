/**
 * @fileoverview JSON одной таблицы: массив объектов по именам столбцов
 * @module shared/tables/io/json-table
 */

import type { IoColumn, IoRow } from "./types";

/**
 * Собирает JSON-массив объектов
 * @param columns - Столбцы
 * @param rows - Строки
 * @returns JSON с отступом в два пробела
 */
export function tableToJson(columns: IoColumn[], rows: IoRow[]): string {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const col of columns) obj[col.name] = row.cells[col.id] ?? "";
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

/**
 * Собирает JSONL: один объект на строку
 * @param columns - Столбцы
 * @param rows - Строки
 * @returns Текст JSONL
 */
export function tableToJsonl(columns: IoColumn[], rows: IoRow[]): string {
  return rows
    .map((row) => {
      const obj: Record<string, string> = {};
      for (const col of columns) obj[col.name] = row.cells[col.id] ?? "";
      return JSON.stringify(obj);
    })
    .join("\n");
}

/**
 * Разбирает JSON-массив объектов в столбцы и строки
 * @param content - Текст файла
 * @returns Имена столбцов и значения
 */
export function parseJsonTable(content: string): { columns: string[]; rows: string[][] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Невалидный JSON: не удалось распарсить файл");
  }
  if (!Array.isArray(parsed)) throw new Error("Ожидается массив объектов, получен другой тип");
  if (parsed.length === 0) throw new Error("Массив пуст — нет данных для импорта");
  const columnsSet = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("Каждый элемент массива должен быть объектом");
    }
    for (const key of Object.keys(item)) columnsSet.add(key);
  }
  const columns = Array.from(columnsSet);
  const rows = parsed.map((item: Record<string, unknown>) =>
    columns.map((col) => {
      const val = item[col];
      return val === undefined || val === null ? "" : String(val);
    }),
  );
  return { columns, rows };
}
