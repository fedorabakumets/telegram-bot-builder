/**
 * @fileoverview Возобновляемый перенос всех снимков версий проекта в S3.
 */
import 'dotenv/config';
import { pool } from '../server/database/db';
import { processPendingVersions, verifyVersionObjectStore } from '../server/database/version-object-store';
import { enqueueVersionMigrationBatch, finishVersionMigration } from '../server/database/version-storage-migration';
import { getVersionStorageSettings } from '../server/database/version-storage-settings';

/**
 * Переносит порции и проверяет отсутствие ожидающих снимков.
 * @returns Завершение переноса
 */
async function main(): Promise<void> {
  const settings = await getVersionStorageSettings();
  if (settings.mode !== 's3' || !settings.storageId) throw new Error('Сначала выберите S3-хранилище версий');
  await verifyVersionObjectStore(settings.storageId);
  let queued = 0;
  while (true) {
    const count = await enqueueVersionMigrationBatch(200);
    queued += count;
    if (count === 0) break;
  }
  await finishVersionMigration();
  console.log(`Поставлено в очередь: ${queued}`);
  let moved = 0;
  while (true) {
    const count = await processPendingVersions(50, 10);
    moved += count;
    if (count === 0) break;
    if (moved % 200 === 0) console.log(`Обработано за запуск: ${moved}`);
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
