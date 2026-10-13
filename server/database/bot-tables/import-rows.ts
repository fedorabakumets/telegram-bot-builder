/**
 * @fileoverview Проверенный импорт строк: добавление или замена
 * @module server/database/bot-tables/import-rows
 */

import { loadColumnsInProject } from "./load-scope";
import { SQL_TIMEOUT } from "./limits";
import { clearRowsInProject, insertRowsInProject, nextRowIndex } from "./mutate-row";
import type { RowRecord } from "./map-records";
import type { MutateFail } from "./mutate-table";
import type { Queryable } from "./queryable";
import { validateCells } from "./validate-cells";

/** Подготовленная строка импорта */
interface ReadyRow {
  /** Индекс */
  rowIndex: number;
  /** Ячейки */
  data: Record<string, string>;
}

/**
 * Проверяет все строки до записи и вставляет их одной транзакцией
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param mode - append или replace
 * @param rows - Объекты ячеек по идентификаторам столбцов
 * @returns Вставленные строки или отказ
 */
export async function importRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  mode: "append" | "replace",
  rows: Array<Record<string, unknown>>,
): Promise<RowRecord[] | MutateFail> {
  const columns = await loadColumnsInProject(db, projectId, tableId);
  if (columns.length === 0) {
    const owned = await db.query(`SELECT id FROM bot_tables WHERE id = $1 AND project_id = $2`, [tableId, projectId]);
    if (!owned.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  }
  const ids = new Set(columns.map((column) => String(column.id)));
  const ready: ReadyRow[] = [];
  for (const [index, row] of rows.entries()) {
    const cells = validateCells(row, ids);
    if (!cells.ok) return { ok: false, status: 400, message: cells.message };
    ready.push({ rowIndex: index, data: cells.data });
  }
  await db.query("BEGIN");
  try {
    await db.query(`SET LOCAL statement_timeout = '${SQL_TIMEOUT}'`);
    if (mode === "replace") {
      const cleared = await clearRowsInProject(db, projectId, tableId);
      if ("status" in cleared) {
        await db.query("ROLLBACK");
        return cleared;
      }
    }
    const start = mode === "replace" ? 0 : await nextRowIndex(db, tableId);
    const inserted = await insertRowsInProject(
      db,
      projectId,
      tableId,
      ready.map((row, index) => ({ rowIndex: start + index, data: row.data })),
    );
    if ("status" in inserted) {
      await db.query("ROLLBACK");
      return inserted;
    }
    await db.query("COMMIT");
    return inserted;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}
