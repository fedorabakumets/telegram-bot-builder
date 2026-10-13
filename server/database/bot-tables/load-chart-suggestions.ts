/**
 * @fileoverview Сводка столбцов и рекомендация графика без выдачи строк.
 */
import type { PoolClient } from 'pg';
import { buildSuggestionPayload, suggestTableChart, type TableChartSuggestionPayload, type TableColumnProfile } from '../../../shared/analytics/table-chart/suggest';
import { TABLE_CHART_NUMERIC_THRESHOLD } from '../../../shared/analytics/table-chart/types';
import { tableNumberSql } from './table-number-sql';

/**
 * Собирает рекомендацию для таблицы проекта.
 * @param client - Соединение транзакции.
 * @param projectId - Проект.
 * @param tableId - Таблица.
 * @returns Ответ или отказ, если таблица чужая.
 */
export async function loadChartSuggestions(client: PoolClient, projectId: number, tableId: number): Promise<{ ok: true; payload: TableChartSuggestionPayload } | { ok: false; status: 404; message: string }> {
  const table = await client.query<{ name: string }>('SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2', [tableId, projectId]);
  if (!table.rowCount) return { ok: false, status: 404, message: 'Таблица не найдена' };
  const result = await client.query<{ id: number; name: string; row_count: number; filled: number; distinct_count: number; avg_length: number; numeric_count: number }>(
    `WITH stats AS (SELECT COUNT(*)::int AS row_count FROM bot_table_rows WHERE table_id = $1)
     SELECT c.id, c.name, s.row_count,
       COUNT(*) FILTER (WHERE btrim(coalesce(r.data ->> (c.id::text), '')) <> '')::int AS filled,
       COUNT(DISTINCT NULLIF(btrim(coalesce(r.data ->> (c.id::text), '')), ''))::int AS distinct_count,
       COALESCE(AVG(char_length(btrim(coalesce(r.data ->> (c.id::text), '')))) FILTER (WHERE btrim(coalesce(r.data ->> (c.id::text), '')) <> ''), 0)::float8 AS avg_length,
       COUNT(*) FILTER (WHERE ${tableNumberSql('r.data ->> (c.id::text)')} IS NOT NULL)::int AS numeric_count
     FROM bot_table_columns c CROSS JOIN stats s LEFT JOIN bot_table_rows r ON r.table_id = c.table_id
     WHERE c.table_id = $1 GROUP BY c.id, c.name, c.position, s.row_count ORDER BY c.position ASC, c.id ASC`,
    [tableId],
  );
  const counted = result.rows.length === 0
    ? await client.query<{ row_count: number }>('SELECT COUNT(*)::int AS row_count FROM bot_table_rows WHERE table_id = $1', [tableId])
    : null;
  const rowCount = Number(result.rows[0]?.row_count ?? counted?.rows[0]?.row_count ?? 0);
  const columns: TableColumnProfile[] = result.rows.map(column => {
    const filled = Number(column.filled);
    return { id: Number(column.id), name: column.name, filled, distinctCount: Number(column.distinct_count), avgLength: Number(column.avg_length), isNumeric: filled > 0 && Number(column.numeric_count) / filled >= TABLE_CHART_NUMERIC_THRESHOLD };
  });
  return { ok: true, payload: buildSuggestionPayload({ projectId, tableId, tableName: table.rows[0].name, rowCount }, columns, suggestTableChart(columns, rowCount)) };
}
