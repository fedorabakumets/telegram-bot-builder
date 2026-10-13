/**
 * @fileoverview Сводка таблицы: число строк и заполненность столбцов
 * @module server/database/bot-tables/summary
 */

import type { ColumnRecord } from "./map-records";
import type { Queryable } from "./queryable";

/** Заполненность одного столбца */
export interface ColumnFill {
  /** Идентификатор */
  id: number;
  /** Имя */
  name: string;
  /** Позиция */
  position: number;
  /** Сколько строк с непустым значением */
  filled: number;
}

/** Сводка таблицы */
export interface TableSummary {
  /** Число строк */
  rowCount: number;
  /** Столбцы */
  columns: ColumnFill[];
}

/**
 * Считает строки и непустые ячейки
 * @param db - Исполнитель SQL
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param columns - Уже загруженные столбцы
 * @returns Сводка
 */
export async function loadTableSummary(
  db: Queryable,
  projectId: number,
  tableId: number,
  columns: ColumnRecord[],
): Promise<TableSummary> {
  const counted = await db.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM bot_table_rows r
     JOIN bot_tables t ON t.id = r.table_id AND t.project_id = $1 AND t.id = $2`,
    [projectId, tableId],
  );
  if (columns.length === 0) return { rowCount: counted.rows[0]?.total ?? 0, columns: [] };
  const filled = await db.query<{ id: number; filled: number }>(
    `SELECT c.id,
       COUNT(r.id) FILTER (
         WHERE NULLIF(btrim(COALESCE(r.data->>c.id::text, '')), '') IS NOT NULL
       )::int AS filled
     FROM bot_table_columns c
     JOIN bot_tables t ON t.id = c.table_id AND t.project_id = $1 AND t.id = $2
     LEFT JOIN bot_table_rows r ON r.table_id = c.table_id
     GROUP BY c.id`,
    [projectId, tableId],
  );
  const byId = new Map(filled.rows.map((row) => [row.id, row.filled]));
  return {
    rowCount: counted.rows[0]?.total ?? 0,
    columns: columns.map((column) => ({
      id: column.id,
      name: column.name,
      position: column.position,
      filled: byId.get(column.id) ?? 0,
    })),
  };
}
