/** @fileoverview Проверка SQL точной аналитики на изолированных временных таблицах PostgreSQL. */
import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { resolveAnalyticsRange } from '../../shared/analytics/range';
import { queryAnalyticsRange } from '../../server/routes/analytics/query-range';

/** Запуск требует явного флага, обычные тесты не подключаются к базе. */
const enabled = process.env.ANALYTICS_SQL_SMOKE === '1';
describe.skipIf(!enabled)('SQL точных диапазонов PostgreSQL', () => {
  it('исключает правую границу и сохраняет уникальные итоги между слотами', async () => {
    dotenv.config({ quiet: true });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      /** Временные таблицы скрывают реальные таблицы только внутри этого соединения. */
      await client.query(`CREATE TEMP TABLE bot_users (project_id int, token_id int, user_id bigint, registered_at timestamp) ON COMMIT DROP;
        CREATE TEMP TABLE bot_messages (project_id int, token_id int, user_id text, created_at timestamp, message_type text) ON COMMIT DROP;
        CREATE TEMP TABLE user_activity_daily (project_id int, token_id int, user_id bigint, day date, first_seen_at timestamptz) ON COMMIT DROP;
        CREATE TEMP TABLE message_activity_daily (project_id int, token_id int, day date, incoming_count int, outgoing_count int) ON COMMIT DROP`);
      await client.query(`INSERT INTO bot_users VALUES (1,1,11,'2026-09-01'),(1,2,11,'2026-09-01'),(1,1,12,'2026-09-03');
        INSERT INTO bot_messages VALUES (1,1,'11','2026-09-01 00:00','user'),(1,2,'11','2026-09-02 00:00','user'),(1,1,'11','2026-09-02 01:00','service'),(1,1,'12','2026-09-03 00:00','user');
        INSERT INTO user_activity_daily VALUES (1,1,11,'2026-09-01','2026-09-01Z'),(1,2,11,'2026-09-02','2026-09-01Z'),(1,1,12,'2026-09-03','2026-09-03Z');
        INSERT INTO message_activity_daily VALUES (1,1,'2026-09-01',1,0),(1,2,'2026-09-02',1,1),(1,1,'2026-09-03',1,0)`);
      const range = resolveAnalyticsRange({ from: '2026-09-01T00:00:00Z', to: '2026-09-03T00:00:00Z', step: '1d' });
      const registrations = await queryAnalyticsRange(client, 1, null, 'registrations', range, false);
      expect(registrations.summary.count).toBe(2);
      for (const daily of [false, true]) {
        const active = await queryAnalyticsRange(client, 1, null, 'active_users', range, daily);
        expect(active.summary.count).toBe(1);
        expect(active.summary.newcomers).toBe(1);
        expect(active.points.map((point: { count: number }) => point.count)).toEqual([1, 1]);
        const messages = await queryAnalyticsRange(client, 1, null, 'messages', range, daily);
        expect(messages.summary).toMatchObject({ count: 3, incoming: 2, outgoing: 1 });
      }
      const token = await queryAnalyticsRange(client, 1, 1, 'messages', range, false);
      expect(token.summary.count).toBe(2);
      const wrongProject = await queryAnalyticsRange(client, 2, null, 'messages', range, false);
      expect(wrongProject.summary.count).toBe(0);
      /** Удаляем только записи временной таблицы; реальная история не затрагивается. */
      await client.query('DELETE FROM pg_temp.bot_messages');
      expect((await queryAnalyticsRange(client, 1, null, 'messages', range, false)).summary.count).toBe(0);
      expect((await queryAnalyticsRange(client, 1, null, 'messages', range, true)).summary.count).toBe(3);
      const partial = resolveAnalyticsRange({ from: '2026-09-01T12:00:00Z', to: '2026-09-02T12:00:00Z', step: '1h' });
      expect((await queryAnalyticsRange(client, 1, null, 'registrations', partial, false)).summary.count).toBe(0);
    } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
  });
});
