/**
 * @fileoverview Одна операция пакета на уже открытом соединении
 * @module server/database/bot-tables/apply-one-op
 */

import { addColumnInProject, deleteColumnInProject, renameColumnInProject } from "./mutate-column";
import {
  deleteRowInProject,
  insertRowsInProject,
  mergeRowInProject,
  nextRowIndex,
  reindexRowsInProject,
  replaceRowInProject,
} from "./mutate-row";
import { loadColumnsInProject } from "./load-scope";
import { parseEntityName, validateCells } from "./validate-cells";
import type { Queryable } from "./queryable";
import type { TableOp } from "./table-ops";

/**
 * Выполняет одну операцию
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param op - Операция
 * @returns Результат или отказ
 */
export async function runTableOp(db: Queryable, projectId: number, tableId: number, op: TableOp): Promise<unknown> {
  const columns = await loadColumnsInProject(db, projectId, tableId);
  const ids = new Set(columns.map((column) => String(column.id)));
  if (op.op === "add_column") {
    const name = parseEntityName(op.name, false);
    if (typeof name !== "string") return name;
    return addColumnInProject(db, projectId, tableId, name, op.position ?? columns.length);
  }
  if (op.op === "rename_column") {
    const name = parseEntityName(op.name, false);
    if (typeof name !== "string") return name;
    return renameColumnInProject(db, projectId, tableId, op.columnId, name);
  }
  if (op.op === "delete_column") return deleteColumnInProject(db, projectId, tableId, op.columnId);
  if (op.op === "reindex") return reindexRowsInProject(db, projectId, tableId);
  if (op.op === "delete_row") return deleteRowInProject(db, projectId, tableId, op.rowId);
  if (op.op === "update_row" || op.op === "patch_row") return writeRow(db, projectId, tableId, op, ids);
  return addRows(db, projectId, tableId, op.rows, ids);
}

/**
 * Заменяет или дополняет строку
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param op - Операция строки
 * @param ids - Допустимые столбцы
 * @returns Строка или отказ
 */
async function writeRow(
  db: Queryable,
  projectId: number,
  tableId: number,
  op: Extract<TableOp, { op: "update_row" | "patch_row" }>,
  ids: Set<string>,
) {
  const cells = validateCells(op.data, ids);
  if (!cells.ok) return { ok: false as const, status: 400, message: cells.message };
  return op.op === "update_row"
    ? replaceRowInProject(db, projectId, tableId, op.rowId, cells.data)
    : mergeRowInProject(db, projectId, tableId, op.rowId, cells.data);
}

/**
 * Добавляет строки пакета
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param source - Строки
 * @param ids - Допустимые столбцы
 * @returns Строки или отказ
 */
async function addRows(
  db: Queryable,
  projectId: number,
  tableId: number,
  source: Array<{ data: Record<string, unknown>; rowIndex?: number }>,
  ids: Set<string>,
) {
  const next = await nextRowIndex(db, tableId);
  const rows = source.map((row, index) => {
    const cells = validateCells(row.data, ids);
    if (!cells.ok) return cells;
    return { rowIndex: row.rowIndex ?? next + index, data: cells.data };
  });
  const failed = rows.find((row) => "ok" in row && row.ok === false);
  if (failed) return failed;
  return insertRowsInProject(db, projectId, tableId, rows as Array<{ rowIndex: number; data: Record<string, string> }>);
}
