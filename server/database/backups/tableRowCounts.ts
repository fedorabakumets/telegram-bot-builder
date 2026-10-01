/**
 * @fileoverview Подсчёт строк в таблицах базы для проверки бэкапа
 * @module server/database/backups/tableRowCounts
 */

import type { Client } from "pg";

/** Расхождение числа строк в таблице */
export interface RowCountMismatch {
  /** Таблица `схема.таблица` */
  table: string;
  /** Строк в бэкапе */
  expected: number;
  /** Строк после восстановления; null — таблицы нет */
  actual: number | null;
}

/**
 * Пользовательские таблицы базы.
 * @param client - Подключённый клиент
 * @returns Имена вида `схема.таблица`
 */
export async function listUserTables(client: Client): Promise<string[]> {
  const result = await client.query<{ name: string }>(
    `SELECT table_schema || '.' || table_name AS name FROM information_schema.tables
     WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')
     ORDER BY 1`,
  );
  return result.rows.map((row) => row.name);
}

/**
 * Считает строки в каждой пользовательской таблице.
 * @param client - Подключённый клиент (внутри снимка — точные числа на момент снимка)
 * @returns Количество строк по таблицам
 */
export async function countTableRows(client: Client): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const name of await listUserTables(client)) {
    const [schema, table] = name.split(".");
    const quoted = `"${schema.replace(/"/g, '""')}"."${table.replace(/"/g, '""')}"`;
    const result = await client.query<{ n: string }>(`SELECT count(*) AS n FROM ${quoted}`);
    counts[name] = Number(result.rows[0].n);
  }
  return counts;
}

/**
 * Сравнивает числа строк из бэкапа с фактическими.
 * @param expected - Строки в бэкапе
 * @param actual - Строки после восстановления
 * @returns Таблицы, где числа не совпали
 */
export function compareRowCounts(expected: Record<string, number>, actual: Record<string, number>): RowCountMismatch[] {
  return Object.entries(expected)
    .filter(([table, count]) => actual[table] !== count)
    .map(([table, count]) => ({ table, expected: count, actual: table in actual ? actual[table] : null }));
}
