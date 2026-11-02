/** @fileoverview Проверки фильтра табличного графика по ISO-дате и принадлежности выбранной колонки. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { createAnalyticsTestDatabase } from './test-database';
import { loadTableChart } from '../../../database/bot-tables/load-table-chart';
import { parseChartRequest } from '../../tables/chart/chart-params';
const database = createAnalyticsTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`CREATE TABLE bot_tables(id integer PRIMARY KEY,project_id integer,name text);
    CREATE TABLE bot_table_columns(id integer PRIMARY KEY,table_id integer,name text);
    CREATE TABLE bot_table_rows(table_id integer,data jsonb);
    INSERT INTO bot_tables VALUES(5,1,'Отчёт'); INSERT INTO bot_table_columns VALUES(1,5,'Категория'),(2,5,'Сумма'),(3,5,'Дата');
    INSERT INTO bot_table_rows VALUES
      (5,'{"1":"A","2":"10","3":"2026-10-30T03:00:00+03:00"}'),
      (5,'{"1":"A","2":"99","3":"2026-10-31T00:00:00Z"}'),
      (5,'{"1":"B","2":"100","3":"2026-02-31"}'),
      (5,'{"1":"B","2":"50","3":"не дата"}');`);
});
afterAll(() => database.cleanup());
describe('Период произвольной таблицы', () => {
  it('учитывает ISO-смещение и исключает правую границу и неверные даты', async () => {
    const client = await database.pool.connect();
    try {
      const result = await loadTableChart(client, { projectId: 1, tableId: 5, xColumnId: 1, yColumnId: 2, aggregation: 'sum', limit: 50,
        dateColumnId: 3, from: '2026-10-30T00:00:00Z', to: '2026-10-31T00:00:00Z' });
      expect(result.ok).toBe(true);
      if (result.ok) { expect(result.payload.row_count).toBe(1); expect(result.payload.points[0].value).toBe(10); }
      expect(await loadTableChart(client, { projectId: 1, tableId: 5, xColumnId: 1, yColumnId: 2, aggregation: 'count', limit: 50,
        dateColumnId: 99, from: '2026-10-30T00:00:00Z', to: '2026-10-31T00:00:00Z' })).toMatchObject({ ok: false, status: 400 });
    } finally { client.release(); }
  });
  it('требует явную колонку и полные границы, сохраняя старый запрос без периода', () => {
    const base = { params: { id: '1', tableId: '5' }, query: { xColumnId: '1', yColumnId: '2' } };
    expect(parseChartRequest(base as unknown as Request)).toMatchObject({ tableId: 5 });
    expect(parseChartRequest({ ...base, query: { ...base.query, from: '2026-10-30T00:00:00Z' } } as unknown as Request)).toHaveProperty('message');
    expect(parseChartRequest({ ...base, query: { ...base.query, dateColumnId: '3', from: '2026-02-31T00:00:00Z', to: '2026-03-02T00:00:00Z' } } as unknown as Request)).toHaveProperty('message');
  });
});
