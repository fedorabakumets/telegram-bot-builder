/**
 * @fileoverview Импорт общего JSON версии 1 по одной таблице
 * @module server/database/bot-tables/import-bundle
 */

import { ensureBundleColumns, resolveBundleTable } from "./import-bundle-schema";
import { SQL_TIMEOUT } from "./limits";
import { clearRowsInProject, insertRowsInProject } from "./mutate-row";
import { parseEntityName, validateCells } from "./validate-cells";
import type { Queryable } from "./queryable";

/** Таблица из файла версии 1 */
export interface BundleTable {
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
  for (let index = 0; index < tables.length; index++) {
    const result = await importOne(db, projectId, mode, tables[index]);
    if (!result.ok) return { ...result, failed_table_index: index };
    done.push(result.item);
  }
  return { ok: true, tables: done };
}

/**
 * Импортирует одну таблицу в своей транзакции
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
  await db.query("BEGIN");
  try {
    await db.query(`SET LOCAL statement_timeout = '${SQL_TIMEOUT}'`);
    const tableId = await resolveBundleTable(db, projectId, mode, name);
    if (typeof tableId !== "number") {
      await db.query("ROLLBACK");
      return tableId;
    }
    const ids = await ensureBundleColumns(db, projectId, tableId, table.columns);
    if (!Array.isArray(ids)) {
      await db.query("ROLLBACK");
      return ids;
    }
    const cleared = await clearRowsInProject(db, projectId, tableId);
    if ("status" in cleared) {
      await db.query("ROLLBACK");
      return cleared;
    }
    const idSet = new Set(ids.map(String));
    const rows = table.rows.map((row, rowIndex) => {
      const data: Record<string, string> = {};
      ids.forEach((id, colIndex) => {
        data[String(id)] = row[colIndex] ?? "";
      });
      const cells = validateCells(data, idSet);
      if (!cells.ok) return cells;
      return { rowIndex, data: cells.data };
    });
    const bad = rows.find((row) => "ok" in row && row.ok === false);
    if (bad && "message" in bad) {
      await db.query("ROLLBACK");
      return { ok: false, status: 400, message: bad.message };
    }
    const inserted = await insertRowsInProject(db, projectId, tableId, rows as Array<{ rowIndex: number; data: Record<string, string> }>);
    if ("status" in inserted) {
      await db.query("ROLLBACK");
      return inserted;
    }
    await db.query("COMMIT");
    return { ok: true, item: { name, tableId, rowCount: inserted.length } };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

