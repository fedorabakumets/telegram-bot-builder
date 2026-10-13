/**
 * @fileoverview Подсчёт графика таблицы в PostgreSQL с проверкой проекта.
 */
import type { PoolClient } from 'pg';
import { buildTableChartPayload, type TableChartPayload } from '../../../shared/analytics/table-chart/payload';
import { TABLE_CHART_NUMERIC_THRESHOLD, type TableAggregation } from '../../../shared/analytics/table-chart/types';
import { tableNumberSql } from './table-number-sql';

/** Параметры проверенного запроса. */
export interface TableChartQuery {
  /** Проект. */
  projectId: number;
  /** Таблица. */
  tableId: number;
  /** Столбец групп. */
  xColumnId: number;
  /** Столбец значений. */
  yColumnId: number;
  /** Способ подсчёта. */
  aggregation: TableAggregation;
  /** Предел групп, не больше 50. */
  limit: number;
}

/** Отказ без содержимого чужой таблицы. */
export interface TableChartRejection {
  /** Успех отсутствует. */
  ok: false;
  /** Код ответа. */
  status: 400 | 404;
  /** Короткое сообщение. */
  message: string;
}

/**
 * Считает группы только для таблицы указанного проекта.
 * @param client - Соединение транзакции.
 * @param input - Проверенные параметры.
 * @returns Ответ или отказ.
 */
export async function loadTableChart(client: PoolClient, input: TableChartQuery): Promise<{ ok: true; payload: TableChartPayload } | TableChartRejection> {
  const table = await client.query<{ name: string }>('SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2', [input.tableId, input.projectId]);
  if (!table.rowCount) return { ok: false, status: 404, message: 'Таблица не найдена' };
  const columns = await client.query<{ id: number; name: string }>('SELECT id, name FROM bot_table_columns WHERE table_id = $1 AND id = ANY($2::int[])', [input.tableId, [input.xColumnId, input.yColumnId]]);
  const names = new Map(columns.rows.map(row => [Number(row.id), row.name]));
  if (!names.has(input.xColumnId) || !names.has(input.yColumnId)) return { ok: false, status: 400, message: 'Столбец не принадлежит таблице' };
  const stats = await client.query<{ row_count: number; filled: number; numeric_count: number }>(
    `SELECT COUNT(*)::int AS row_count,
      COUNT(*) FILTER (WHERE btrim(coalesce(data ->> $3, '')) <> '')::int AS filled,
      COUNT(*) FILTER (WHERE ${tableNumberSql('data ->> $3')} IS NOT NULL)::int AS numeric_count
     FROM bot_table_rows WHERE table_id = $1 AND EXISTS (SELECT 1 FROM bot_tables t WHERE t.id = table_id AND t.project_id = $2)`,
    [input.tableId, input.projectId, String(input.yColumnId)],
  );
  const row = stats.rows[0];
  const filled = Number(row?.filled ?? 0);
  const yIsNumeric = filled > 0 && Number(row?.numeric_count ?? 0) / filled >= TABLE_CHART_NUMERIC_THRESHOLD;
  const aggregation = !yIsNumeric && input.aggregation !== 'count' ? 'count' : input.aggregation;
  const grouped = await client.query<{ label: string; value: number; group_count: number; avg_label_length: number }>(
    `SELECT label, value, COUNT(*) OVER ()::int AS group_count, COALESCE(AVG(char_length(label)) OVER (), 0)::float8 AS avg_label_length
     FROM (SELECT label, CASE $5 WHEN 'count' THEN COUNT(*)::float8 WHEN 'sum' THEN COALESCE(SUM(num), 0)::float8
       WHEN 'avg' THEN COALESCE(AVG(num), 0)::float8 WHEN 'min' THEN COALESCE(MIN(num), 0)::float8 ELSE COALESCE(MAX(num), 0)::float8 END AS value
       FROM (SELECT CASE WHEN btrim(coalesce(r.data ->> $3, '')) = '' THEN '—' ELSE r.data ->> $3 END AS label, ${tableNumberSql('r.data ->> $4')} AS num
         FROM bot_table_rows r INNER JOIN bot_tables t ON t.id = r.table_id AND t.project_id = $2 AND t.id = $1) cells GROUP BY label) grouped
     ORDER BY value DESC, label ASC LIMIT $6`,
    [input.tableId, input.projectId, String(input.xColumnId), String(input.yColumnId), aggregation, input.limit],
  );
  const first = grouped.rows[0];
  return { ok: true, payload: buildTableChartPayload(
    { ...input, aggregation },
    { tableName: table.rows[0].name, xName: names.get(input.xColumnId) ?? '', yName: names.get(input.yColumnId) ?? '', yIsNumeric,
      rowCount: Number(row?.row_count ?? 0), groupCount: Number(first?.group_count ?? 0), avgLabelLength: Number(first?.avg_label_length ?? 0),
      points: grouped.rows.map(point => ({ label: String(point.label), value: Number(point.value) })), coercedToCount: aggregation !== input.aggregation },
  ) };
}
