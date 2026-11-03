/**
 * @fileoverview Регистрация загруженного объекта с очисткой при ошибке базы данных.
 */
import type { StorageBackend } from '../../storage/storage-backend';
import { storage } from '../../storages/storage';
import { uploadKeyFromUrl } from '../../storage/uploads-storage';
import type { UploadPersistResult } from './upload-storage-helper';

/** Сохраняет метаданные либо удаляет только что записанный объект.
 * @param backend - Хранилище объекта
 * @param persisted - Результат записи объекта
 * @param data - Метаданные для базы
 * @returns Созданная запись медиа
 */
export async function createRegisteredUpload(backend: StorageBackend, persisted: UploadPersistResult, data: Parameters<typeof storage.createMediaFile>[0]) {
  try { return await storage.createMediaFile(data); }
  catch (error) {
    const key = backend.configId === 'local-default' ? uploadKeyFromUrl(persisted.url) : persisted.filePath;
    if (key) await backend.delete(key).catch(() => {});
    throw error;
  }
}
