/**
 * @fileoverview Показывает состояние переноса и очереди удаления снимков версий.
 */
import 'dotenv/config';
import { pool } from '../server/database/db';

/**
 * Выводит безопасные агрегаты без содержимого снимков и секретов.
 * @returns Завершение проверки состояния
 */
async function main(): Promise<void> {
  const versions = await pool.query(`SELECT count(*) AS total,
    count(*) FILTER (WHERE snapshot_state = 'ready' AND snapshot IS NULL) AS ready,
    count(*) FILTER (WHERE snapshot IS NOT NULL) AS pending,
    count(*) FILTER (WHERE snapshot IS NULL AND snapshot_key IS NULL) AS missing,
    min(created_at) FILTER (WHERE snapshot IS NOT NULL) AS oldest_pending,
    coalesce(sum(snapshot_bytes), 0) AS raw_bytes
    FROM project_versions`);
  const deletions = await pool.query('SELECT count(*) AS queued FROM project_version_object_deletions');
  console.log({ ...versions.rows[0], queuedDeletions: deletions.rows[0].queued });
}

main().catch(error => { console.error('Не удалось получить состояние:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
