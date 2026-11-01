/**
 * @fileoverview Импорт общего JSON версии 1 по одной таблице
 * @module server/database/bot-tables/import-bundle
 */

import { tableColumnSettingsSchema, type TableColumnSettings } from '../../../shared/table-column-settings';
import { loadColumnsInProject } from './load-scope';
import { ensureBundleColumns, resolveBundleTable } from "./import-bundle-schema";
import { SQL_TIMEOUT } from "./limits";
import { clearRowsInProject, insertRowsInProject } from "./mutate-row";
import { parseEntityName, validateCells } from "./validate-cells";
import type { Queryable } from "./queryable";

/** Таблица из файла версии 1 */
export interface BundleTable {
  /** Необязательные подписи и типы столбцов файла. */
  columnSettings?: TableColumnSettings[];
  /** Имя */
  name: string;
  /** Имена столбцов */
  columns: string[];
  /** Строки по порядку столбцов */
  rows: string[][];
}

/** Итог одной таблицы */
export interface BundleItemResult {
  /** Имя */
  name: string;
  /** Идентификатор */
  tableId: number;
  /** Сколько строк записано */
  rowCount: number;
}

/**
 * Создаёт или заменяет таблицы проекта
 * @param db - Клиент
 * @param projectId - Проект
 * @param mode - create или replace
 * @param tables - Таблицы файла
 * @returns Результаты или индекс ошибки
 */
export async function importBundleInProject(
  db: Queryable,
  projectId: number,
  mode: "create" | "replace",
  tables: BundleTable[],
): Promise<{ ok: true; tables: BundleItemResult[] } | { ok: false; status: number; message: string; failed_table_index: number }> {
  const done: BundleItemResult[] = [];
  await db.query('BEGIN');
  try {
  await db.query(`SET LOCAL statement_timeout = '${SQL_TIMEOUT}'`);
  await db.query('SELECT id FROM bot_projects WHERE id = $1 FOR UPDATE', [projectId]);
  for (let index = 0; index < tables.length; index++) {
    const result = await importOne(db, projectId, mode, tables[index]);
    if (!result.ok) { await db.query('ROLLBACK'); return { ...result, failed_table_index: index }; }
    done.push(result.item);
  }
  await db.query('COMMIT'); return { ok: true, tables: done };
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}

/**
 * Импортирует одну таблицу внутри общей транзакции файла
 * @param db - Клиент
 * @param projectId - Проект
 * @param mode - Режим
 * @param table - Данные
 * @returns Итог или отказ
 */
async function importOne(
  db: Queryable,
  projectId: number,
  mode: "create" | "replace",
  table: BundleTable,
): Promise<{ ok: true; item: BundleItemResult } | { ok: false; status: number; message: string }> {
  const name = parseEntityName(table.name, true);
  if (typeof name !== "string") return { ok: false, status: 400, message: name.message };
    const tableId = await resolveBundleTable(db, projectId, mode, name);
    if (typeof tableId !== "number") {
      return tableId;
    }
    const ids = await ensureBundleColumns(db, projectId, tableId, table.columns);
    if (!Array.isArray(ids)) {
      return ids;
    }
    if (table.columnSettings) {
      const parsed = tableColumnSettingsSchema.array().safeParse(table.columnSettings);
      if (!parsed.success || parsed.data.length !== ids.length) return { ok: false, status: 400, message: 'Проверьте настройки столбцов файла' };
      for (const [index, settings] of parsed.data.entries()) await db.query('UPDATE bot_table_columns SET settings = $2::jsonb WHERE id = $1', [ids[index], JSON.stringify(settings)]);
    }
    const cleared = await clearRowsInProject(db, projectId, tableId);
    if ("status" in cleared) {
      return cleared;
    }
    const columns = await loadColumnsInProject(db, projectId, tableId);
    const idSet = new Set(ids.map(String));
    const rows = table.rows.map((row, rowIndex) => {
      const data: Record<string, string> = {};
      ids.forEach((id, colIndex) => {
        data[String(id)] = row[colIndex] ?? "";
      });
      const cells = validateCells(data, idSet, columns, true);
      if (!cells.ok) return cells;
      return { rowIndex, data: cells.data };
    });
    const bad = rows.find((row) => "ok" in row && row.ok === false);
    if (bad && "message" in bad) {
      return { ok: false, status: 400, message: bad.message };
    }
    const inserted = await insertRowsInProject(db, projectId, tableId, rows as Array<{ rowIndex: number; data: Record<string, string> }>);
    if ("status" in inserted) {
      return inserted;
    }
    return { ok: true, item: { name, tableId, rowCount: inserted.length } };
}

