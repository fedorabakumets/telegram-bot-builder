/**
 * @fileoverview Поиск таблицы и столбцов при импорте JSON версии 1
 * @module server/database/bot-tables/import-bundle-schema
 */

import { CONTENT_TABLE_NAME } from "./limits";
import { addColumnInProject } from "./mutate-column";
import { parseEntityName } from "./validate-cells";
import type { Queryable } from "./queryable";

/**
 * Находит таблицу для замены или создаёт новую
 * @param db - Клиент
 * @param projectId - Проект
 * @param mode - Режим
 * @param name - Имя
 * @returns Идентификатор или отказ
 */
export async function resolveBundleTable(
  db: Queryable,
  projectId: number,
  mode: "create" | "replace",
  name: string,
): Promise<number | { ok: false; status: number; message: string }> {
  if (mode === "replace") {
    const found = await db.query<{ id: number; name: string }>(
      `SELECT id, name FROM bot_tables WHERE project_id = $1 AND name = $2 ORDER BY id LIMIT 1`,
      [projectId, name],
    );
    if (found.rows[0]?.name === CONTENT_TABLE_NAME) {
      return { ok: false, status: 400, message: "Служебную таблицу _content нельзя заменить" };
    }
    if (found.rows[0]) return found.rows[0].id;
  }
  const created = await db.query<{ id: number }>(
    `INSERT INTO bot_tables (project_id, name) VALUES ($1, $2) RETURNING id`,
    [projectId, name],
  );
  return created.rows[0].id;
}

/**
 * Добавляет недостающие столбцы по имени
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param names - Имена из файла
 * @returns Идентификаторы в порядке файла или отказ
 */
export async function ensureBundleColumns(
  db: Queryable,
  projectId: number,
  tableId: number,
  names: string[],
): Promise<number[] | { ok: false; status: number; message: string }> {
  const existing = await db.query<{ id: number; name: string }>(
    `SELECT c.id, c.name FROM bot_table_columns c
     JOIN bot_tables t ON t.id = c.table_id
     WHERE c.table_id = $1 AND t.project_id = $2`,
    [tableId, projectId],
  );
  const byName = new Map(existing.rows.map((column) => [column.name, column.id]));
  const ids: number[] = [];
  for (const raw of names) {
    const name = parseEntityName(raw, false);
    if (typeof name !== "string") return { ok: false, status: 400, message: name.message };
    const known = byName.get(name);
    if (known) {
      ids.push(known);
      continue;
    }
    const added = await addColumnInProject(db, projectId, tableId, name, ids.length);
    if ("status" in added) return added;
    byName.set(name, added.id);
    ids.push(added.id);
  }
  return ids;
}
