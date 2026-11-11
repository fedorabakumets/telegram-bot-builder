/**
 * @fileoverview Прямая запись нового снимка версии в приватное S3 до создания метаданных.
 */
import type { ProjectVersion } from '@shared/schema';
import { pool } from './db';
import { decodeSnapshot, encodeSnapshot } from './version-object-codec';
import { resolveVersionBackend } from './version-object-store';

/** Метаданные проверенного объекта версии. */
export interface WrittenVersionObject {
  /** Выданный PostgreSQL идентификатор версии. */
  id: number;
  /** ID приватного S3-хранилища. */
  storageId: string;
  /** Неизменяемый ключ объекта. */
  key: string;
  /** Размер исходного JSON в байтах. */
  bytes: number;
  /** Контрольная сумма исходного JSON. */
  sha256: string;
}

/**
 * Резервирует идентификатор версии для неизменяемого ключа S3.
 * @returns Следующий уникальный идентификатор
 */
export async function reserveVersionId(): Promise<number> {
  const result = await pool.query<{ id: string }>(
    "SELECT nextval(pg_get_serial_sequence('project_versions', 'id')) AS id");
  return Number(result.rows[0].id);
}

/**
 * Загружает снимок, затем проверяет размер и SHA-256 по прочитанному объекту.
 * @param id - Зарезервированный идентификатор версии
 * @param projectId - Идентификатор проекта
 * @param snapshot - Полный снимок проекта
 * @param storageId - ID приватного S3-хранилища
 * @returns Метаданные проверенного объекта
 */
export async function writeVersionObject(id: number, projectId: number, snapshot: unknown,
  storageId: string): Promise<WrittenVersionObject> {
  const backend = await resolveVersionBackend(storageId);
  const key = `project-versions/${projectId}/${id}.json.gz`;
  const encoded = encodeSnapshot(snapshot);
  try {
    await backend.put(key, encoded.body, 'application/gzip');
    await decodeSnapshot(await backend.get(key), {
      snapshotBytes: encoded.bytes, snapshotSha256: encoded.sha256,
    } as ProjectVersion);
  } catch (error) {
    try { await backend.delete(key); }
    catch (cleanupError) { console.error('[VersionDirectWrite] Очистка объекта после ошибки:', cleanupError); }
    throw error;
  }
  return { id, storageId: backend.configId, key, bytes: encoded.bytes, sha256: encoded.sha256 };
}
