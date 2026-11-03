/**
 * @fileoverview Краткоживущая проверка доступности выбранного S3.
 * @module server/storage/selected-storage-health
 */
import { S3Backend } from "./s3-backend";
import type { StorageBackend } from "./storage-backend";

/** Проверки кэшируются по экземпляру, поэтому перезагрузка реестра сбрасывает кэш. */
const checks = new WeakMap<StorageBackend, { until: number; promise: Promise<void> }>();

/**
 * Проверяет бакет и объединяет параллельные запросы; ошибки не кэшируются.
 * @param backend - Бэкенд выбранного хранилища
 * @returns Завершение проверки доступности
 */
export async function ensureSelectedStorageAvailable(backend: StorageBackend): Promise<void> {
  if (!(backend instanceof S3Backend)) throw new Error("Выбранное S3-хранилище недоступно");
  const cached = checks.get(backend);
  if (cached && cached.until > Date.now()) return cached.promise;
  const entry = { until: Date.now() + 5000, promise: Promise.resolve() };
  entry.promise = backend.checkAvailability().then(() => { entry.until = Date.now() + 5000; }).catch(() => {
    checks.delete(backend);
    throw new Error("Выбранное S3-хранилище недоступно");
  });
  checks.set(backend, entry);
  return entry.promise;
}
