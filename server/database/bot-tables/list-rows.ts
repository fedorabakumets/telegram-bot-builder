/**
 * @fileoverview Полный список строк таблицы проекта для интерфейса
 * @module server/database/bot-tables/list-rows
 */

import { mapRow, type RowRecord } from "./map-records";
import type { Queryable } from "./queryable";

/**
 * Возвращает все строки таблицы, если она принадлежит проекту
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Строки по индексу
 */
export async function listRowsInProject(db: Queryable, projectId: number, tableId: number): Promise<RowRecord[]> {
  const result = await db.query(
    `SELECT r.id, r.table_id, r.row_index, r.data
     FROM bot_table_rows r
     JOIN bot_tables t ON t.id = r.table_id AND t.project_id = $1 AND t.id = $2
     ORDER BY r.row_index, r.id`,
    [projectId, tableId],
  );
  return result.rows.map((row) => mapRow(row as never));
}

/**
 * Ищет таблицы проекта по части имени
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param query - Подстрока имени
 * @param limit - Предел
 * @returns Таблицы
 */
export async function findTablesInProject(
  db: Queryable,
  projectId: number,
  query: string,
  limit: number,
): Promise<Array<{ id: number; projectId: number; name: string; createdAt: Date | string | null }>> {
  const result = await db.query(
    `SELECT id, project_id, name, created_at
     FROM bot_tables
     WHERE project_id = $1 AND name ILIKE $2 ESCAPE '\\'
     ORDER BY id
     LIMIT $3`,
    [projectId, `%${query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`, limit],
  );
  return result.rows.map((row) => {
    const table = row as { id: number; project_id: number; name: string; created_at: Date | string | null };
    return { id: table.id, projectId: table.project_id, name: table.name, createdAt: table.created_at };
  });
}
