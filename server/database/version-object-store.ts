/**
 * @fileoverview Фоновый перенос снимков версий в приватное S3 и удаление объектов.
 */
import { and, asc, eq, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { projectVersions } from '@shared/schema';
import { db, pool } from './db';
import { ensureStorageRegistryLoaded } from '../storage/storage-registry';
import { decodeSnapshot, encodeSnapshot } from './version-object-codec';
import { getVersionStorageSettings } from './version-storage-settings';

/**
 * Возвращает приватный S3-бэкенд для новых снимков.
 * @param storageId - ID сохранённой конфигурации или текущая настройка
 * @returns Настроенное хранилище
 */
export async function resolveVersionBackend(storageId?: string | null) {
  const id = storageId || process.env.VERSION_SNAPSHOT_STORAGE_ID?.trim();
  if (!id) throw new Error('VERSION_SNAPSHOT_STORAGE_ID не задан');
  const backend = (await ensureStorageRegistryLoaded()).resolveBackend(id);
  if (backend.backend !== 's3' || backend.readOnly) throw new Error('Хранилище версий должно быть доступным для записи S3');
  return backend;
}

/**
 * Загружает объект версии после проверки метаданных доступа вызывающим кодом.
 * @param version - Строка версии проекта
 * @returns Проверенный снимок проекта
 */
export async function readVersionObject(version: typeof projectVersions.$inferSelect): Promise<unknown> {
  if (version.snapshot !== null) return version.snapshot;
  if (!version.snapshotKey || !version.snapshotStorageId) throw new Error('Снимок версии отсутствует');
  const backend = (await ensureStorageRegistryLoaded()).resolveBackend(version.snapshotStorageId);
  if (backend.backend !== 's3') throw new Error('Неверный тип хранилища версии');
  return decodeSnapshot(await backend.get(version.snapshotKey), version);
}

/**
 * Переносит одну ожидающую версию; повторный вызов безопасен.
 * @param version - Строка ожидающей версии
 * @returns Завершение переноса
 */
export async function uploadPendingVersion(version: typeof projectVersions.$inferSelect): Promise<void> {
  if (version.snapshot === null || version.snapshotState === 'ready') return;
  /** Закрепляем бакет за строкой до PUT, чтобы смена конфига не меняла цель повтора. */
  const targetId = version.snapshotStorageId || (await getVersionStorageSettings()).storageId;
  if (!targetId) throw new Error('VERSION_SNAPSHOT_STORAGE_ID не задан');
  await db.update(projectVersions).set({ snapshotStorageId: targetId })
    .where(and(eq(projectVersions.id, version.id), isNull(projectVersions.snapshotStorageId)));
  const [assigned] = await db.select({ storageId: projectVersions.snapshotStorageId }).from(projectVersions)
    .where(eq(projectVersions.id, version.id));
  if (!assigned) return;
  const backend = await resolveVersionBackend(assigned.storageId);
  const key = `project-versions/${version.projectId}/${version.id}.json.gz`;
  const encoded = encodeSnapshot(version.snapshot);
  await backend.put(key, encoded.body, 'application/gzip');
  const checked = await decodeSnapshot(await backend.get(key), {
    ...version, snapshotBytes: encoded.bytes, snapshotSha256: encoded.sha256,
  });
  if (JSON.stringify(checked) !== JSON.stringify(version.snapshot)) throw new Error('Проверка снимка после загрузки не прошла');
  await db.update(projectVersions).set({ snapshot: null, snapshotStorageId: backend.configId,
    snapshotKey: key, snapshotSha256: encoded.sha256, snapshotBytes: encoded.bytes, snapshotState: 'ready',
    snapshotRetryAt: null })
    .where(and(eq(projectVersions.id, version.id), isNotNull(projectVersions.snapshot)));
}

/**
 * Обрабатывает небольшую порцию старых и новых снимков без блокировки API.
 * @param limit - Максимальный размер порции
 * @param concurrency - Число одновременных загрузок в S3
 * @returns Число обработанных строк
 */
export async function processPendingVersions(limit = 20, concurrency = 1): Promise<number> {
  const rows = await db.select().from(projectVersions).where(and(isNotNull(projectVersions.snapshot),
    eq(projectVersions.snapshotState, 'pending'), or(isNull(projectVersions.snapshotRetryAt),
      lte(projectVersions.snapshotRetryAt, new Date())))).orderBy(asc(projectVersions.id)).limit(limit);
  /** Ограничиваем одновременные операции, не создавая отдельный пул задач. */
  for (let start = 0; start < rows.length; start += concurrency) {
    await Promise.all(rows.slice(start, start + concurrency).map(async row => {
      try { await uploadPendingVersion(row); }
      catch (error) {
        /** Увеличиваем паузу, чтобы один проблемный объект не блокировал очередь. */
        const attempts = row.snapshotAttempts + 1;
        const delay = Math.min(3600, 5 * 2 ** Math.min(attempts, 10));
        await db.update(projectVersions).set({ snapshotAttempts: attempts,
          snapshotRetryAt: new Date(Date.now() + delay * 1000) })
          .where(and(eq(projectVersions.id, row.id), isNotNull(projectVersions.snapshot)));
        console.error(`[VersionObjectWorker] Версия ${row.id} ожидает повтора:`, error);
      }
    }));
  }
  return rows.length;
}

/**
 * Удаляет объекты, поставленные в очередь триггером PostgreSQL.
 * @param limit - Максимальный размер порции
 * @param graceMs - Пауза перед физическим удалением для согласованного бэкапа
 * @returns Число удалённых объектов
 */
export async function processVersionObjectDeletions(limit = 20, graceMs = 24 * 60 * 60 * 1000): Promise<number> {
  const result = await pool.query<{ id: string; storage_id: string; object_key: string }>(
    'SELECT id, storage_id, object_key FROM project_version_object_deletions WHERE created_at <= NOW() - ($2::bigint * INTERVAL \'1 millisecond\') ORDER BY id LIMIT $1',
    [limit, graceMs]);
  const registry = await ensureStorageRegistryLoaded();
  for (const row of result.rows) {
    const backend = registry.resolveBackend(row.storage_id);
    if (backend.backend !== 's3') throw new Error('Неверный тип хранилища удаляемого снимка');
    await backend.delete(row.object_key);
    await pool.query('DELETE FROM project_version_object_deletions WHERE id = $1', [row.id]);
  }
  return result.rows.length;
}

/**
 * Проверяет доступность и запись, чтение и удаление временного объекта.
 * @returns Завершение проверки
 */
export async function verifyVersionObjectStore(storageId?: string): Promise<void> {
  const backend = await resolveVersionBackend(storageId);
  const key = `project-versions/.health/${Date.now()}-${process.pid}.txt`;
  await backend.put(key, Buffer.from('ok'), 'text/plain');
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of await backend.get(key)) chunks.push(Buffer.from(chunk));
    if (Buffer.concat(chunks).toString() !== 'ok') throw new Error('Чтение S3 вернуло неверные данные');
  } finally { await backend.delete(key); }
}
