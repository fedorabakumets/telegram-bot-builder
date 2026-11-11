/**
 * @fileoverview Возобновляемый перенос всех снимков версий проекта в S3.
 */
import 'dotenv/config';
import { pool } from '../server/database/db';
import { processPendingVersions, verifyVersionObjectStore } from '../server/database/version-object-store';

/**
 * Переносит порции и проверяет отсутствие ожидающих снимков.
 * @returns Завершение переноса
 */
async function main(): Promise<void> {
  await verifyVersionObjectStore();
  let moved = 0;
  while (true) {
    const count = await processPendingVersions(50);
    moved += count;
    if (count === 0) break;
    console.log(`Перенесено за запуск: ${moved}`);
  }
  const result = await pool.query<{ pending: string; ready: string; missing: string }>(`
    SELECT count(*) FILTER (WHERE snapshot IS NOT NULL)::text AS pending,
      count(*) FILTER (WHERE snapshot_state = 'ready' AND snapshot IS NULL)::text AS ready,
      count(*) FILTER (WHERE snapshot IS NULL AND snapshot_key IS NULL)::text AS missing
    FROM project_versions`);
  const status = result.rows[0];
  console.log(`Готово: ${status.ready}, ожидают: ${status.pending}, отсутствуют: ${status.missing}`);
  if (Number(status.pending) || Number(status.missing)) process.exitCode = 1;
}

main().catch(error => { console.error('Перенос остановлен:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
