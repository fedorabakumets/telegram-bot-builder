/**
 * @fileoverview Сверка поиска и подсчёта на временных таблицах
 * @module lib/bot-tools/bot-tables-sql.test
 */

import { describe, expect, it } from 'vitest';
import { countRowsInProject, queryRowsInProject } from '../../server/database/bot-tables/query-rows.ts';

const enabled = process.env.TABLE_QUERY_SQL === '1' && Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)('SQL поиска строк', () => {
  it('фильтрует и считает на временных таблицах', async () => {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('CREATE TEMP TABLE bot_tables (id int, project_id int, name text, created_at timestamptz)');
      await client.query('CREATE TEMP TABLE bot_table_columns (id int, table_id int, name text, position int)');
      await client.query('CREATE TEMP TABLE bot_table_rows (id int, table_id int, row_index int, data jsonb)');
      await client.query(`INSERT INTO bot_tables VALUES (1, 7, 'Товары', now())`);
      await client.query(`INSERT INTO bot_table_columns VALUES (3, 1, 'имя', 0)`);
      await client.query(`INSERT INTO bot_table_rows VALUES (10, 1, 0, '{"3":"хлеб"}'), (11, 1, 1, '{"3":"молоко"}')`);
      const page = await queryRowsInProject(client, 7, 1, [{ columnId: 3, operator: 'equals', value: 'хлеб' }], { kind: 'id' }, 100, 0, null);
      const other = await countRowsInProject(client, 8, 1, []);
      expect(page.total).toBe(1);
      expect(page.rows[0]?.data['3']).toBe('хлеб');
      expect(other).toBe(0);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });
});
