/**
 * @fileoverview Сверка всех приватных S3-бакетов, способных хранить версии.
 */
import { pool } from './db';
import { reconcileVersionObjects } from './version-object-reconcile';

/**
 * Удаляет осиротевшие объекты из каждого приватного S3-хранилища.
 * @returns Завершение сверки
 */
export async function reconcileAllVersionObjects(): Promise<void> {
  const result = await pool.query<{ id: string; config: Record<string, unknown> }>(
    "SELECT id, config FROM storage_configs WHERE backend = 's3' AND read_only = false");
  for (const row of result.rows) {
    if (row.config?.publicUrlBase) continue;
    try { await reconcileVersionObjects(row.id); }
    catch (error) { console.error(`[VersionObjectWorker] Сверка ${row.id}:`, error); }
  }
}
