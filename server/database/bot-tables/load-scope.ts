/**
 * @fileoverview Проверка цепочки проект → таблица → столбец → строка
 * @module server/database/bot-tables/load-scope
 */

import type { Queryable } from "./queryable";
import { mapColumn, mapRow, mapTable, type ColumnRecord, type RowRecord, type TableRecord } from "./map-records";

/**
 * Таблица проекта или undefined
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Запись или undefined
 */
export async function loadTableInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
): Promise<TableRecord | undefined> {
  const result = await db.query(
    `SELECT id, project_id, name, created_at
     FROM bot_tables WHERE id = $1 AND project_id = $2`,
    [tableId, projectId],
  );
  return result.rows[0] ? mapTable(result.rows[0] as never) : undefined;
}

/**
 * Столбцы таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Столбцы по позиции
 */
export async function loadColumnsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
): Promise<ColumnRecord[]> {
  const result = await db.query(
    `SELECT c.id, c.table_id, c.name, c.position
     FROM bot_table_columns c
     JOIN bot_tables t ON t.id = c.table_id
     WHERE c.table_id = $1 AND t.project_id = $2
     ORDER BY c.position, c.id`,
    [tableId, projectId],
  );
  return result.rows.map((row) => mapColumn(row as never));
}

/**
 * Один столбец таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnId - Столбец
 * @returns Столбец или undefined
 */
export async function loadColumnInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  columnId: number,
): Promise<ColumnRecord | undefined> {
  const result = await db.query(
    `SELECT c.id, c.table_id, c.name, c.position
     FROM bot_table_columns c
     JOIN bot_tables t ON t.id = c.table_id
     WHERE c.id = $1 AND c.table_id = $2 AND t.project_id = $3`,
    [columnId, tableId, projectId],
  );
  return result.rows[0] ? mapColumn(result.rows[0] as never) : undefined;
}

/**
 * Одна строка таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param rowId - Строка
 * @returns Строка или undefined
 */
export async function loadRowInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  rowId: number,
): Promise<RowRecord | undefined> {
  const result = await db.query(
    `SELECT r.id, r.table_id, r.row_index, r.data
     FROM bot_table_rows r
     JOIN bot_tables t ON t.id = r.table_id
     WHERE r.id = $1 AND r.table_id = $2 AND t.project_id = $3`,
    [rowId, tableId, projectId],
  );
  return result.rows[0] ? mapRow(result.rows[0] as never) : undefined;
}
