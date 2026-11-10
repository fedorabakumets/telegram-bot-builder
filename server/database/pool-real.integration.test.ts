/** @fileoverview Проверка исчерпания и восстановления настоящего локального пула без изменения данных. */
import { Pool } from 'pg';
import { expect, it } from 'vitest';
import { installPoolAcquireDiagnostics } from './pool-diagnostics';
import { probePool } from './pool-recovery';

/** Адрес задаётся только при явном запуске локальной проверки. */
const connectionString = process.env.LOCAL_DATABASE_TEST_URL;
if (connectionString && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString).hostname)) {
  throw new Error('Проверка разрешена только для локальной PostgreSQL');
}

it.skipIf(!connectionString)('переживает очередь занятого пула и снова выполняет запросы после освобождения', async () => {
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 500, idleTimeoutMillis: 1000 });
  const events: object[] = [];
  installPoolAcquireDiagnostics(pool, (event) => events.push(event));
  try {
    const held = await pool.connect();
    try {
      await expect(pool.query('SELECT 1')).rejects.toThrow(/timeout/i);
      expect(events).toEqual([expect.objectContaining({ event: 'acquire_timeout', total: 1, idle: 0, max: 1 })]);
    } finally { held.release(); }
    expect((await pool.query('SELECT 1 AS healthy')).rows[0].healthy).toBe(1);
    await probePool(pool);
    expect(pool.idleCount).toBe(1);
    expect(pool.waitingCount).toBe(0);
    expect(JSON.stringify(events)).not.toContain('SELECT');
    expect(JSON.stringify(events)).not.toContain(connectionString);
  } finally { await pool.end(); }
}, 10000);
