/**
 * @fileoverview Создание и поиск системной таблицы _content для проекта
 * @module services/content-table/create-content-table
 */

import { storage } from "../../storages/storage";

/** Имя системной таблицы контента */
const CONTENT_TABLE_NAME = "_content";

/** Колонки таблицы _content в порядке позиций */
const CONTENT_COLUMNS = ["key", "type", "sheet", "label", "value"] as const;

/**
 * Находит или создаёт таблицу _content с 5 колонками для проекта
 * @param projectId - ID проекта
 * @returns ID таблицы _content
 */
export async function ensureContentTable(projectId: number): Promise<number> {
  const tables = await storage.getBotTables(projectId);
  const existing = tables.find((t) => t.name === CONTENT_TABLE_NAME);

  if (existing) {
    return existing.id;
  }

  const table = await storage.createBotTable({
    projectId,
    name: CONTENT_TABLE_NAME,
  });

  for (let i = 0; i < CONTENT_COLUMNS.length; i++) {
    await storage.createBotTableColumn({
      tableId: table.id,
      name: CONTENT_COLUMNS[i],
      position: i,
    });
  }

  return table.id;
}
