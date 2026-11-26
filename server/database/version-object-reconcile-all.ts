/**
 * @fileoverview Сверка всех приватных S3-бакетов, способных хранить версии.
 */
import { pool } from './db';
import { ensureStorageRegistryLoaded } from '../storage/storage-registry';
import { reconcileVersionObjects } from './version-object-reconcile';

/**
 * Удаляет осиротевшие объекты из каждого приватного S3-хранилища.
 * @returns Завершение сверки
 */
export async function reconcileAllVersionObjects(): Promise<void> {
  const result = await pool.query<{ id: string; config: Record<string, unknown> }>(
    "SELECT id, config FROM storage_configs WHERE backend = 's3' AND read_only = false");
  /** Пропущенные реестром конфигурации нельзя сверять до восстановления их доступа. */
  const available = new Set((await ensureStorageRegistryLoaded()).listWritable()
    .filter(backend => backend.backend === 's3').map(backend => backend.configId));
  for (const row of result.rows) {
    if (!available.has(row.id)) continue;
    if (row.config?.publicUrlBase) continue;
    try { await reconcileVersionObjects(row.id); }
    catch (error) { console.error(`[VersionObjectWorker] Сверка ${row.id}:`, error); }
  }
}
