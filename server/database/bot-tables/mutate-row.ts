/**
 * @fileoverview Строки таблицы с проверкой проекта
 * @module server/database/bot-tables/mutate-row
 */

import { mapRow, type RowRecord } from "./map-records";
import type { MutateFail } from "./mutate-table";
import type { Queryable } from "./queryable";

export { clearRowsInProject, nextRowIndex, reindexRowsInProject } from "./row-maintenance";

/**
 * Вставляет строки и возвращает их
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rows - Индекс и ячейки
 * @returns Строки или отказ
 */
export async function insertRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  rows: Array<{ rowIndex: number; data: Record<string, string> }>,
): Promise<RowRecord[] | MutateFail> {
  const payload = JSON.stringify(rows.map((row) => ({ row_index: row.rowIndex, data: row.data })));
  const inserted = await db.query(
    `INSERT INTO bot_table_rows (table_id, row_index, data)
     SELECT $1, x.row_index, x.data
     FROM jsonb_to_recordset($3::jsonb) AS x(row_index int, data jsonb)
     WHERE EXISTS (SELECT 1 FROM bot_tables t WHERE t.id = $1 AND t.project_id = $2)
     RETURNING id, table_id, row_index, data`,
    [tableId, projectId, payload],
  );
  if (rows.length > 0 && inserted.rows.length === 0) return { ok: false, status: 404, message: "Таблица не найдена" };
  return inserted.rows.map((row) => mapRow(row as never));
}

/**
 * Полностью заменяет ячейки строки
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param data - Новые ячейки
 * @returns Строка или отказ
 */
export async function replaceRowInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  rowId: number,
  data: Record<string, string>,
): Promise<RowRecord | MutateFail> {
  const updated = await db.query(
    `UPDATE bot_table_rows r SET data = $4::jsonb
     FROM bot_tables t
     WHERE r.id = $1 AND r.table_id = $2 AND t.id = r.table_id AND t.project_id = $3
     RETURNING r.id, r.table_id, r.row_index, r.data`,
    [rowId, tableId, projectId, JSON.stringify(data)],
  );
  if (!updated.rows[0]) return { ok: false, status: 404, message: "Строка не найдена" };
  return mapRow(updated.rows[0] as never);
}

/**
 * Объединяет ячейки с уже сохранёнными
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @param data - Изменённые ячейки
 * @returns Строка или отказ
 */
export async function mergeRowInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  rowId: number,
  data: Record<string, string>,
): Promise<RowRecord | MutateFail> {
  const updated = await db.query(
    `UPDATE bot_table_rows r SET data = COALESCE(r.data, '{}'::jsonb) || $4::jsonb
     FROM bot_tables t
     WHERE r.id = $1 AND r.table_id = $2 AND t.id = r.table_id AND t.project_id = $3
     RETURNING r.id, r.table_id, r.row_index, r.data`,
    [rowId, tableId, projectId, JSON.stringify(data)],
  );
  if (!updated.rows[0]) return { ok: false, status: 404, message: "Строка не найдена" };
  return mapRow(updated.rows[0] as never);
}

/**
 * Удаляет одну строку проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @returns Успех или отказ
 */
export async function deleteRowInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  rowId: number,
): Promise<{ ok: true } | MutateFail> {
  const deleted = await db.query(
    `DELETE FROM bot_table_rows r USING bot_tables t
     WHERE r.id = $1 AND r.table_id = $2 AND t.id = r.table_id AND t.project_id = $3`,
    [rowId, tableId, projectId],
  );
  if (!deleted.rowCount) return { ok: false, status: 404, message: "Строка не найдена" };
  return { ok: true };
}

