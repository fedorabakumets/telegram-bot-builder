/**
 * @fileoverview Изменение таблицы внутри проекта
 * @module server/database/bot-tables/mutate-table
 */

import { contentGuard } from "./limits";
import { mapTable, type TableRecord } from "./map-records";
import type { Queryable } from "./queryable";

/** Отказ изменения */
export interface MutateFail {
  /** Признак отказа */
  ok: false;
  /** Код HTTP */
  status: number;
  /** Сообщение */
  message: string;
}

/**
 * Переименовывает таблицу проекта, кроме _content
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param name - Новое имя
 * @returns Таблица или отказ
 */
export async function renameTableInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  name: string,
): Promise<TableRecord | MutateFail> {
  const current = await db.query<{ name: string }>(
    `SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2`,
    [tableId, projectId],
  );
  if (!current.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  const blocked = contentGuard(current.rows[0].name);
  if (blocked) return { ok: false, status: 400, message: blocked };
  const updated = await db.query(
    `UPDATE bot_tables SET name = $3 WHERE id = $1 AND project_id = $2 RETURNING id, project_id, name, created_at`,
    [tableId, projectId, name],
  );
  if (!updated.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  return mapTable(updated.rows[0] as never);
}

/**
 * Удаляет таблицу проекта, кроме _content
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @returns Успех или отказ
 */
export async function deleteTableInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
): Promise<{ ok: true } | MutateFail> {
  const current = await db.query<{ name: string }>(
    `SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2`,
    [tableId, projectId],
  );
  if (!current.rows[0]) return { ok: false, status: 404, message: "Таблица не найдена" };
  const blocked = contentGuard(current.rows[0].name);
  if (blocked) return { ok: false, status: 400, message: blocked };
  const deleted = await db.query(
    `DELETE FROM bot_tables WHERE id = $1 AND project_id = $2 AND name <> '_content'`,
    [tableId, projectId],
  );
  if (!deleted.rowCount) return { ok: false, status: 404, message: "Таблица не найдена" };
  return { ok: true };
}
