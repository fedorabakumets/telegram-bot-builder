/**
 * @fileoverview Сверка приватного S3 с метаданными версий и очистка объектов-сирот.
 */
import { pool } from './db';
import { ensureStorageRegistryLoaded } from '../storage/storage-registry';
import { S3Backend } from '../storage/s3-backend';

/**
 * Удаляет осиротевшие объекты старше суток из выделенного префикса.
 * @param storageId - ID приватного S3-хранилища
 * @returns Число удалённых объектов
 */
export async function reconcileVersionObjects(storageId: string): Promise<number> {
  const backend = (await ensureStorageRegistryLoaded()).resolveBackend(storageId);
  if (!(backend instanceof S3Backend)) throw new Error('Для сверки требуется S3');
  let cursor: string | undefined;
  let removed = 0;
  do {
    const page = await backend.listObjects('project-versions/', cursor);
    cursor = page.nextCursor;
    const old = page.objects.filter(object => object.modified
      && Date.now() - object.modified.getTime() > 24 * 60 * 60 * 1000);
    if (old.length === 0) continue;
    const keys = old.map(object => object.key);
    const referenced = await pool.query<{ snapshot_key: string }>(
      `SELECT snapshot_key FROM project_versions WHERE snapshot_storage_id = $1 AND snapshot_key = ANY($2::text[])
       UNION SELECT object_key AS snapshot_key FROM project_version_object_deletions
       WHERE storage_id = $1 AND object_key = ANY($2::text[]) AND created_at > NOW() - INTERVAL '1 day'`,
      [storageId, keys]);
    const active = new Set(referenced.rows.map(row => row.snapshot_key));
    for (const key of keys) {
      if (active.has(key)) continue;
      await backend.delete(key);
      removed++;
    }
  } while (cursor);
  return removed;
}
