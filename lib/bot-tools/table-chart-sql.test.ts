/** @fileoverview Сверка SQL-графика с общими правилами на временных таблицах. */
import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { aggregateTableData } from '../../shared/analytics/table-chart/aggregate';
import { loadChartSuggestions } from '../../server/database/bot-tables/load-chart-suggestions';
import { loadTableChart } from '../../server/database/bot-tables/load-table-chart';

/** Запуск требует явного флага, чтобы обычные тесты не подключались к базе. */
const enabled = process.env.TABLE_CHART_SQL === '1';
const rows = [
  { data: { '10': 'a', '13': '12abc' } }, { data: { '10': 'a', '13': '1e2' } },
  { data: { '10': 'b', '13': '3' } }, { data: { '10': '   ', '13': '.5' } }, { data: { '10': 'b', '13': '' } },
];

describe.skipIf(!enabled)('SQL графика таблицы', () => {
  it('совпадает с общими правилами и не читает чужую таблицу', async () => {
    dotenv.config({ quiet: true });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`CREATE TEMP TABLE bot_tables (id int, project_id int, name text) ON COMMIT DROP;
        CREATE TEMP TABLE bot_table_columns (id int, table_id int, name text, position int) ON COMMIT DROP;
        CREATE TEMP TABLE bot_table_rows (table_id int, data jsonb) ON COMMIT DROP`);
      await client.query(`INSERT INTO bot_tables VALUES (1,7,'content'),(2,8,'secret');
        INSERT INTO bot_table_columns VALUES (10,1,'key',0),(13,1,'amount',1),(12,2,'secret',0);
        INSERT INTO bot_table_rows VALUES (1,'{"10":"a","13":"12abc"}'),(1,'{"10":"a","13":"1e2"}'),(1,'{"10":"b","13":"3"}'),(1,'{"10":"   ","13":".5"}'),(1,'{"10":"b","13":""}'),(2,'{"12":"hidden"}')`);
      const chart = await loadTableChart(client, { projectId: 7, tableId: 1, xColumnId: 10, yColumnId: 13, aggregation: 'sum', limit: 50 });
      expect(chart.ok).toBe(true);
      if (chart.ok) expect(chart.payload.points).toEqual(aggregateTableData(rows, '10', '13', 'sum'));
      expect(await loadTableChart(client, { projectId: 7, tableId: 2, xColumnId: 12, yColumnId: 12, aggregation: 'count', limit: 50 })).toMatchObject({ ok: false, status: 404 });
      expect(await loadTableChart(client, { projectId: 7, tableId: 1, xColumnId: 12, yColumnId: 13, aggregation: 'count', limit: 50 })).toMatchObject({ ok: false, status: 400 });
      const suggestion = await loadChartSuggestions(client, 7, 1);
      expect(suggestion.ok).toBe(true);
      if (suggestion.ok) expect(suggestion.payload.reason.length).toBeGreaterThan(0);
    } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  });
});
