/** @fileoverview Интеграционная проверка SQL аналитики на временных таблицах без изменения данных проекта. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { Pool } from 'pg';
import { queryGroupsStats, queryGroupsGrowth } from '../../server/routes/analytics/groups-analytics-query';
import { querySourcesAllTime } from '../../server/routes/analytics/sources-all-time-query';

/**
 * Проверяет дедупликацию групп, фильтры проектов и ботов и историю старше года.
 * @returns Завершение после отката временных данных.
 */
async function verifyAnalyticsScope() {
  const env = parse(readFileSync('.env'));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  /** Все запросы используют одно соединение и видят только временные таблицы. */
  const isolated = { query: (sql: string, params?: unknown[]) => client.query(sql, params) } as unknown as Pool;
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TEMP TABLE bot_groups (project_id int, token_id int, group_id text, chat_type text, created_at timestamptz) ON COMMIT DROP;
      CREATE TEMP TABLE chat_access (project_id int, token_id int, chat_id text, status text) ON COMMIT DROP;
      CREATE TEMP TABLE bot_users (project_id int, token_id int, registered_at timestamptz, deep_link_param text) ON COMMIT DROP;
      INSERT INTO bot_groups VALUES
        (12, 11, 'g1', 'group', NOW() - INTERVAL '40 days'),
        (12, 22, 'g1', 'supergroup', NOW() - INTERVAL '2 days'),
        (12, 11, 'g2', 'group', NOW() - INTERVAL '1 day'),
        (12, 22, 'g2', 'group', NOW() - INTERVAL '1 day'),
        (12, 22, 'g3', 'group', NOW()),
        (12, 11, 'channel', 'channel', NOW()),
        (99, 11, 'foreign', 'group', NOW());
      INSERT INTO chat_access VALUES
        (12, 11, 'g1', 'available'), (12, 22, 'g1', 'kicked'),
        (12, 11, 'g2', 'kicked'), (12, 22, 'g3', 'kicked');
      INSERT INTO bot_users VALUES
        (12, 11, NOW() - INTERVAL '400 days', 'old'),
        (12, 22, NOW() - INTERVAL '20 days', 'fresh'),
        (12, 11, NOW() - INTERVAL '2 days', NULL),
        (99, 11, NOW(), 'foreign'),
        (14, 11, NOW(), 'single'),
        (15, 11, NOW() - INTERVAL '11 years', 'archive');
    `);
    assert.deepEqual(await queryGroupsStats(isolated, 12, null), {
      totalGroups: 3, availableGroups: 1, kickedGroups: 1, addedLast7Days: 2,
    });
    assert.deepEqual(await queryGroupsStats(isolated, 12, 11), {
      totalGroups: 2, availableGroups: 1, kickedGroups: 1, addedLast7Days: 1,
    });
    const growth = await queryGroupsGrowth(isolated, 12, null, '1d');
    assert.equal(growth.reduce((sum, point) => sum + point.count, 0), 2);
    const botGrowth = await queryGroupsGrowth(isolated, 12, 11, '1d');
    assert.equal(botGrowth.reduce((sum, point) => sum + point.count, 0), 1);
    const history = await querySourcesAllTime(isolated, 12, null);
    assert.ok(history.length > 12);
    assert.equal(history.reduce((sum, point) => sum + Object.values(point.sources).reduce((a, b) => a + b, 0), 0), 3);
    assert.ok(history.some(point => point.sources.old === 1));
    const scoped = await querySourcesAllTime(isolated, 12, 11);
    assert.ok(scoped.every(point => !point.sources.fresh && !point.sources.foreign));
    const single = await querySourcesAllTime(isolated, 14, null);
    assert.equal(single.length, 1);
    assert.equal(single[0].sources.single, 1);
    const archive = await querySourcesAllTime(isolated, 15, null);
    assert.ok(archive.length <= 13);
    assert.equal(archive[0].sources.archive, 1);
    const empty = await querySourcesAllTime(isolated, 55, null);
    assert.equal(empty.length, 1);
    assert.deepEqual(empty[0].sources, {});
    console.log('Проверено: уникальные группы проекта, фильтр бота, даты первого появления, вся история и пустой проект.');
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
}

void verifyAnalyticsScope().catch(error => {
  console.error(error instanceof Error ? error.message : 'Ошибка проверки аналитики');
  process.exitCode = 1;
});
