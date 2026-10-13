/**
 * @fileoverview Выполнение ограниченного поиска строк
 * @module server/database/bot-tables/query-rows
 */

import { compileRowQuery, type RowFilter, type RowSort } from "./compile-row-query";
import { SQL_TIMEOUT } from "./limits";
import { mapRow, stringCells, type RowRecord } from "./map-records";
import type { Queryable } from "./queryable";

/** Страница строк */
export interface RowPage {
  /** Строки страницы */
  rows: RowRecord[];
  /** Сколько всего подошло под фильтр */
  total: number;
  /** Предел страницы */
  limit: number;
  /** Смещение */
  offset: number;
}

/**
 * Читает страницу в короткой транзакции с таймаутом
 * @param db - Клиент, не пул
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param filters - Условия
 * @param sort - Сортировка
 * @param limit - Предел
 * @param offset - Смещение
 * @param projectColumnIds - Какие ключи оставить
 * @returns Страница
 */
export async function queryRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  filters: RowFilter[],
  sort: RowSort,
  limit: number,
  offset: number,
  projectColumnIds: number[] | null,
): Promise<RowPage> {
  const compiled = compileRowQuery(projectId, tableId, filters, sort, limit, offset);
  await db.query("BEGIN");
  try {
    await db.query(`SET LOCAL statement_timeout = '${SQL_TIMEOUT}'`);
    const listed = await db.query(compiled.listSql, compiled.listValues);
    const counted = await db.query<{ total: number }>(compiled.countSql, compiled.countValues);
    await db.query("COMMIT");
    const keep = projectColumnIds?.map(String) ?? null;
    const rows = listed.rows.map((row) => {
      const mapped = mapRow(row as never);
      if (!keep) return mapped;
      const data: Record<string, string> = {};
      const cells = stringCells(mapped.data);
      for (const id of keep) data[id] = cells[id] ?? "";
      return { ...mapped, data };
    });
    return { rows, total: counted.rows[0]?.total ?? 0, limit, offset };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

/**
 * Считает строки тем же фильтром
 * @param db - Клиент
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param filters - Условия
 * @returns Количество
 */
export async function countRowsInProject(
  db: Queryable,
  projectId: number,
  tableId: number,
  filters: RowFilter[],
): Promise<number> {
  const page = await queryRowsInProject(db, projectId, tableId, filters, { kind: "id" }, 1, 0, []);
  return page.total;
}
