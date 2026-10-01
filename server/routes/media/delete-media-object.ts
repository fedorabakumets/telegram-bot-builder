/**
 * @fileoverview Удаление содержимого медиафайла из его хранилища: для S3 —
 * объект в бакете и оставшаяся после переноса локальная копия в `uploads/`,
 * для локального хранилища — файл на диске по `filePath`.
 * @module server/routes/media/delete-media-object
 */

import { unlink } from "fs/promises";
import path from "path";

import { ensureStorageRegistryLoaded } from "../../storage/storage-registry";
import { uploadKeyFromPath } from "../../storage/uploads-storage";

/** Поля записи media_files, нужные для удаления содержимого */
export interface MediaObjectRef {
  /** Путь на диске (local) либо ключ объекта (s3) */
  filePath: string;
  /** Тип бэкенда ("local" | "s3") */
  storageBackend: string | null;
  /** ID хранилища (storage_configs.id) */
  storageConfigId: string | null;
}

/**
 * Удаляет файл с диска; отсутствие файла не считается ошибкой.
 * @param filePath - Путь к файлу
 */
async function unlinkQuiet(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
  }
}

/**
 * Удаляет содержимое медиафайла из хранилища, где оно лежит.
 * @param media - Запись media_files
 * @returns Promise завершения удаления
 */
export async function deleteMediaObject(media: MediaObjectRef): Promise<void> {
  if (media.storageBackend !== "s3") {
    await unlinkQuiet(media.filePath);
    return;
  }
  const key = uploadKeyFromPath(media.filePath);
  if (!key) return;
  const registry = await ensureStorageRegistryLoaded();
  await registry.resolveBackend(media.storageConfigId).delete(key);
  await unlinkQuiet(path.join(process.cwd(), "uploads", key));
}
