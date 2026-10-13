/**
 * @fileoverview Типы и разбор пакета операций над таблицей
 * @module server/database/bot-tables/table-ops
 */

import { MAX_ADD_ROWS, MAX_OPS } from "./limits";
import { parseOneOp } from "./parse-one-op";

/** Добавление столбца */
export interface AddColumnOp {
  /** Вид */
  op: "add_column";
  /** Имя */
  name: string;
  /** Позиция */
  position?: number;
}

/** Переименование столбца */
export interface RenameColumnOp {
  /** Вид */
  op: "rename_column";
  /** Столбец */
  columnId: number;
  /** Имя */
  name: string;
}

/** Удаление столбца */
export interface DeleteColumnOp {
  /** Вид */
  op: "delete_column";
  /** Столбец */
  columnId: number;
}

/** Добавление строк */
export interface AddRowsOp {
  /** Вид */
  op: "add_rows";
  /** Строки */
  rows: Array<{ data: Record<string, unknown>; rowIndex?: number }>;
}

/** Замена строки */
export interface UpdateRowOp {
  /** Вид */
  op: "update_row";
  /** Строка */
  rowId: number;
  /** Ячейки */
  data: Record<string, unknown>;
}

/** Слияние ячеек */
export interface PatchRowOp {
  /** Вид */
  op: "patch_row";
  /** Строка */
  rowId: number;
  /** Ячейки */
  data: Record<string, unknown>;
}

/** Удаление строки */
export interface DeleteRowOp {
  /** Вид */
  op: "delete_row";
  /** Строка */
  rowId: number;
}

/** Переиндексация */
export interface ReindexOp {
  /** Вид */
  op: "reindex";
}

/** Операция пакета */
export type TableOp =
  | AddColumnOp
  | RenameColumnOp
  | DeleteColumnOp
  | AddRowsOp
  | UpdateRowOp
  | PatchRowOp
  | DeleteRowOp
  | ReindexOp;

/**
 * Пакет содержит удаление
 * @param ops - Операции
 * @returns Нужно подтверждение
 */
export function opsNeedConfirm(ops: TableOp[]): boolean {
  return ops.some((op) => op.op === "delete_column" || op.op === "delete_row");
}

/**
 * Разбирает массив операций
 * @param input - Тело ops
 * @returns Операции или ошибка
 */
export function parseTableOps(input: unknown): TableOp[] | { message: string } {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_OPS) {
    return { message: `Нужно от 1 до ${MAX_OPS} операций` };
  }
  const ops: TableOp[] = [];
  let rowBudget = 0;
  for (const item of input) {
    const parsed = parseOneOp(item) as TableOp | { message: string };
    if ("message" in parsed) return parsed;
    if (parsed.op === "add_rows") {
      rowBudget += parsed.rows.length;
      if (rowBudget > MAX_ADD_ROWS) return { message: `Не больше ${MAX_ADD_ROWS} строк за пакет` };
    }
    ops.push(parsed);
  }
  return ops;
}

