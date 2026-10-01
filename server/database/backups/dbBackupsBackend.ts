/**
 * @fileoverview Выбор хранилища для бэкапов базы
 *
 * В дампе есть токены ботов и сессии userbot, поэтому публичное
 * `local-default` (раздаётся через `/uploads`) для бэкапов не используется.
 * @module server/database/backups/dbBackupsBackend
 */

import { LocalDiskBackend } from "../../storage/local-disk-backend";
import type { StorageBackend } from "../../storage/storage-backend";
import { ensureStorageRegistryLoaded } from "../../storage/storage-registry";
import { DB_BACKUPS_LOCAL_ID, getDbBackupsDir, getDbBackupsStorageId } from "./dbBackupConfig";

/** ID публичного локального хранилища, запрещённого для бэкапов */
const PUBLIC_LOCAL_ID = "local-default";

/**
 * Приватное локальное хранилище бэкапов (папка вне `uploads/`).
 * @returns Локальный бэкенд
 */
export function getLocalDbBackupsBackend(): StorageBackend {
  return new LocalDiskBackend({
    configId: DB_BACKUPS_LOCAL_ID,
    name: "Локально: бэкапы базы",
    readOnly: false,
    rootPath: getDbBackupsDir(),
  });
}

/**
 * Хранилище бэкапов по ID или из `DB_BACKUPS_STORAGE_ID`.
 * @param configId - ID хранилища из `storage_configs`; не задан — из окружения или локальная папка
 * @returns Бэкенд для записи и чтения бэкапов
 * @throws Если хранилище не найдено, только для чтения или публичное
 */
export async function resolveDbBackupsBackend(configId?: string | null): Promise<StorageBackend> {
  const id = configId?.trim() || getDbBackupsStorageId();
  if (!id || id === DB_BACKUPS_LOCAL_ID) return getLocalDbBackupsBackend();
  if (id === PUBLIC_LOCAL_ID) throw new Error(`Хранилище "${PUBLIC_LOCAL_ID}" публичное — бэкапы в него не пишутся`);
  const registry = await ensureStorageRegistryLoaded();
  const backend = registry.list().find((item) => item.configId === id);
  if (!backend) throw new Error(`Хранилище бэкапов "${id}" не найдено в storage_configs`);
  if (backend.readOnly) throw new Error(`Хранилище бэкапов "${id}" доступно только для чтения`);
  return backend;
}
