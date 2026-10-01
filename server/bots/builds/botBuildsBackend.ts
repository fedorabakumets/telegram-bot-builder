/**
 * @fileoverview Выбор хранилища для сборок ботов
 * @module server/bots/builds/botBuildsBackend
 */

import { LocalDiskBackend } from "../../storage/local-disk-backend";
import type { StorageBackend } from "../../storage/storage-backend";
import { ensureStorageRegistryLoaded } from "../../storage/storage-registry";
import { BOT_BUILDS_LOCAL_ID, getBotBuildsDir, getBotBuildsStorageId } from "./botBuildConfig";

/** Кэш приватного локального бэкенда по пути папки */
let localBackend: { dir: string; backend: StorageBackend } | null = null;

/**
 * Возвращает приватный локальный бэкенд (папка вне `uploads/`, не раздаётся по HTTP).
 * @returns Локальный бэкенд сборок
 */
export function getLocalBotBuildsBackend(): StorageBackend {
  const dir = getBotBuildsDir();
  if (!localBackend || localBackend.dir !== dir) {
    localBackend = {
      dir,
      backend: new LocalDiskBackend({
        configId: BOT_BUILDS_LOCAL_ID,
        name: "Локально: сборки ботов",
        readOnly: false,
        rootPath: dir,
      }),
    };
  }
  return localBackend.backend;
}

/**
 * Ищет бэкенд по ID без отката на `local-default`: тот раздаёт файлы
 * публично через `/uploads`, поэтому подменять им хранилище сборок нельзя.
 * @param configId - ID хранилища
 * @returns Бэкенд или null, если такого хранилища нет
 */
export async function resolveBotBuildsBackend(configId: string): Promise<StorageBackend | null> {
  if (configId === BOT_BUILDS_LOCAL_ID) return getLocalBotBuildsBackend();
  const registry = await ensureStorageRegistryLoaded();
  return registry.list().find((backend) => backend.configId === configId) ?? null;
}

/**
 * Хранилище для записи новых сборок: `BOT_BUILDS_STORAGE_ID` или приватная папка.
 * @returns Бэкенд для записи
 * @throws Если указанное хранилище не найдено или только для чтения
 */
export async function getWritableBotBuildsBackend(): Promise<StorageBackend> {
  const configId = getBotBuildsStorageId();
  if (!configId) return getLocalBotBuildsBackend();
  const backend = await resolveBotBuildsBackend(configId);
  if (!backend) throw new Error(`Хранилище сборок "${configId}" не найдено в storage_configs`);
  if (backend.readOnly) throw new Error(`Хранилище сборок "${configId}" доступно только для чтения`);
  return backend;
}
