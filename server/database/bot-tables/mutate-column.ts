/**
 * @fileoverview Столбцы таблицы с проверкой проекта
 * @module server/database/bot-tables/mutate-column
 */

import { loadColumnsInProject } from "./load-scope";
import { mapColumn, type ColumnRecord } from "./map-records";
import type { MutateFail } from "./mutate-table";
import type { Queryable } from "./queryable";

/**
 * Добавляет столбец только если таблица принадлежит проекту
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param name - Имя
 * @param position - Позиция
 * @returns Столбец или отказ
 */
export async function addColumnInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  name: string,
  position: number,
): Promise<ColumnRecord | MutateFail> {
  const inserted = await db.query(
    `INSERT INTO bot_table_columns (table_id, name, position)
     SELECT t.id, $3, $4 FROM bot_tables t WHERE t.id = $1 AND t.project_id = $2
     RETURNING id, table_id, name, position`,
    [tableId, projectId, name, position],
  );
  if (!inserted.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  return mapColumn(inserted.rows[0] as never);
}

/**
 * Переименовывает столбец таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnId - Столбец
 * @param name - Новое имя
 * @returns Столбец или отказ
 */
export async function renameColumnInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  columnId: number,
  name: string,
): Promise<ColumnRecord | MutateFail> {
  const updated = await db.query(
    `UPDATE bot_table_columns c SET name = $4
     FROM bot_tables t
     WHERE c.id = $1 AND c.table_id = $2 AND t.id = c.table_id AND t.project_id = $3
     RETURNING c.id, c.table_id, c.name, c.position`,
    [columnId, tableId, projectId, name],
  );
  if (!updated.rows[0]) return { ok: false, status: 404, message: "Столбец не найден" };
  return mapColumn(updated.rows[0] as never);
}

/**
 * Удаляет столбец таблицы проекта
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnId - Столбец
 * @returns Успех или отказ
 */
export async function deleteColumnInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  columnId: number,
): Promise<{ ok: true } | MutateFail> {
  const deleted = await db.query(
    `DELETE FROM bot_table_columns c USING bot_tables t
     WHERE c.id = $1 AND c.table_id = $2 AND t.id = c.table_id AND t.project_id = $3`,
    [columnId, tableId, projectId],
  );
  if (!deleted.rowCount) return { ok: false, status: 404, message: "Столбец не найден" };
  return { ok: true };
}

/**
 * Выставляет позиции столбцов в переданном порядке
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columnIds - Полный список идентификаторов
 * @returns Столбцы или отказ
 */
export async function reorderColumnsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  columnIds: number[],
): Promise<ColumnRecord[] | MutateFail> {
  const current = await loadColumnsInProject(db, projectId, tableId);
  if (current.length === 0 && columnIds.length === 0) return [];
  const known = new Set(current.map((column) => column.id));
  if (known.size !== columnIds.length || columnIds.some((id) => !known.has(id))) {
    return { ok: false, status: 400, message: "Список столбцов не совпадает со схемой" };
  }
  const positions = columnIds.map((_, index) => index);
  await db.query(
    `UPDATE bot_table_columns c SET position = u.pos
     FROM unnest($1::int[], $2::int[]) AS u(id, pos)
     WHERE c.id = u.id AND c.table_id = $3
       AND EXISTS (SELECT 1 FROM bot_tables t WHERE t.id = c.table_id AND t.project_id = $4)`,
    [columnIds, positions, tableId, projectId],
  );
  return loadColumnsInProject(db, projectId, tableId);
}
