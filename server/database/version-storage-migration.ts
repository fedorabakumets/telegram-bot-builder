/**
 * @fileoverview Постановка старых версий PostgreSQL в очередь переноса S3.
 */
import { pool } from './db';
import { getVersionStorageSettings } from './version-storage-settings';

/**
 * Возвращает счётчики версий для панели управления.
 * @returns Количество версий по состояниям
 */
export async function getVersionStorageCounts() {
  const result = await pool.query<{ postgres: string; pending: string; s3: string; retries: string }>(`
    SELECT COUNT(*) FILTER (WHERE snapshot IS NOT NULL AND snapshot_state = 'postgres') AS postgres,
      COUNT(*) FILTER (WHERE snapshot IS NOT NULL AND snapshot_state = 'pending') AS pending,
      COUNT(*) FILTER (WHERE snapshot IS NULL AND snapshot_state = 'ready') AS s3,
      COUNT(*) FILTER (WHERE snapshot IS NOT NULL AND snapshot_attempts > 0) AS retries
    FROM project_versions`);
  const row = result.rows[0];
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

/**
 * Ставит одну ограниченную партию в очередь, сохраняя снимки в БД до проверки S3.
 * @param limit - Размер партии
 * @returns Число поставленных версий
 */
export async function enqueueVersionMigrationBatch(limit = 100): Promise<number> {
  const settings = await getVersionStorageSettings();
  if (settings.mode !== 's3' || !settings.storageId) return 0;
  const result = await pool.query(`WITH batch AS (
    SELECT id FROM project_versions WHERE snapshot IS NOT NULL AND snapshot_state = 'postgres'
    ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED
  ) UPDATE project_versions AS v SET snapshot_state = 'pending', snapshot_storage_id = $2,
    snapshot_retry_at = NULL, snapshot_attempts = 0 FROM batch WHERE v.id = batch.id`,
  [limit, settings.storageId]);
  return result.rowCount ?? 0;
}

/**
 * Запоминает намерение миграции, чтобы обработчик продолжил её после перезапуска.
 * @returns Завершение записи
 */
export async function requestVersionMigration(): Promise<void> {
  await pool.query(`INSERT INTO app_settings (key, value, updated_at)
    VALUES ('project_versions.migration_requested', '1', NOW())
    ON CONFLICT (key) DO UPDATE SET value = '1', updated_at = NOW()`);
}

/**
 * Проверяет, запрошено ли продолжение миграции.
 * @returns Признак активной миграции
 */
export async function isVersionMigrationRequested(): Promise<boolean> {
  const result = await pool.query<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'project_versions.migration_requested'");
  return result.rows[0]?.value === '1';
}

/**
 * Завершает постановку в очередь после обработки последней партии.
 * @returns Завершение записи
 */
export async function finishVersionMigration(): Promise<void> {
  await pool.query("UPDATE app_settings SET value = '0', updated_at = NOW() WHERE key = 'project_versions.migration_requested'");
}
