/**
 * @fileoverview Очистка, перенумерация и следующий индекс строк
 * @module server/database/bot-tables/row-maintenance
 */

import type { MutateFail } from "./mutate-table";
import type { Queryable } from "./queryable";

/**
 * Удаляет все строки таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Число удалённых строк или отказ
 */
export async function clearRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
): Promise<{ ok: true; deleted: number } | MutateFail> {
  const owned = await db.query(`SELECT id FROM bot_tables WHERE id = $1 AND project_id = $2`, [tableId, projectId]);
  if (!owned.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  const deleted = await db.query(`DELETE FROM bot_table_rows WHERE table_id = $1`, [tableId]);
  return { ok: true, deleted: deleted.rowCount ?? 0 };
}

/**
 * Заново нумерует строки с нуля
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Успех или отказ
 */
export async function reindexRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
): Promise<{ ok: true } | MutateFail> {
  const owned = await db.query(`SELECT id FROM bot_tables WHERE id = $1 AND project_id = $2`, [tableId, projectId]);
  if (!owned.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  await db.query(
    `WITH ordered AS (
       SELECT r.id, (ROW_NUMBER() OVER (ORDER BY r.row_index, r.id) - 1) AS pos
       FROM bot_table_rows r WHERE r.table_id = $1
     )
     UPDATE bot_table_rows r SET row_index = ordered.pos FROM ordered WHERE r.id = ordered.id`,
    [tableId],
  );
  return { ok: true };
}

/**
 * Следующий свободный индекс строки
 * @param db - Исполнитель SQL
 * @param tableId - Таблица
 * @returns Индекс
 */
export async function nextRowIndex(db: Queryable, tableId: number): Promise<number> {
  const result = await db.query<{ next: number }>(
    `SELECT (COALESCE(MAX(row_index), -1) + 1)::int AS next FROM bot_table_rows WHERE table_id = $1`,
    [tableId],
  );
  return result.rows[0]?.next ?? 0;
}
