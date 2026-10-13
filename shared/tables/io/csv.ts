/**
 * @fileoverview Разбор и сборка CSV без изменения правил интерфейса
 * @module shared/tables/io/csv
 */

import type { IoColumn, IoRow } from "./types";

/**
 * Экранирует ячейку для CSV
 * @param value - Текст ячейки
 * @returns Безопасный фрагмент CSV
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Собирает CSV: первая строка — имена столбцов
 * @param columns - Столбцы по порядку
 * @param rows - Строки
 * @returns Текст CSV без завершающего перевода строки
 */
export function tableToCsv(columns: IoColumn[], rows: IoRow[]): string {
  const header = columns.map((col) => escapeCsvValue(col.name)).join(",");
  const body = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row.cells[col.id] ?? "")).join(","),
  );
  return [header, ...body].join("\n");
}

/**
 * Разбирает CSV с кавычками и переводами строк внутри значений
 * @param content - Текст файла
 * @returns Имена столбцов и строки значений
 */
export function parseCsv(content: string): { columns: string[]; rows: string[][] } {
  const lines = parseCsvLines(content);
  if (lines.length === 0) return { columns: [], rows: [] };
  return { columns: lines[0], rows: lines.slice(1) };
}

/**
 * Делит CSV на строки значений
 * @param content - Сырой текст
 * @returns Двумерный массив
 */
function parseCsvLines(content: string): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"' && content[i + 1] === '"') {
        value += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        value += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      current.push(value);
      value = "";
      i++;
    } else if (ch === "\r" && content[i + 1] === "\n") {
      current.push(value);
      result.push(current);
      current = [];
      value = "";
      i += 2;
    } else if (ch === "\n") {
      current.push(value);
      result.push(current);
      current = [];
      value = "";
      i++;
    } else {
      value += ch;
      i++;
    }
  }
  if (value || current.length > 0) {
    current.push(value);
    result.push(current);
  }
  return result;
}
