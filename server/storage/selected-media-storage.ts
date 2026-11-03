/**
 * @fileoverview Выбор активного S3 для серверной фильтрации медиа.
 * @module server/storage/selected-media-storage
 */
import { ensureStorageRegistryLoaded } from "./storage-registry";
import { getUploadsStorageId } from "./uploads-storage";
import { ensureSelectedStorageAvailable } from "./selected-storage-health";

/** Ошибка недоступности выбранного хранилища без технических деталей. */
export class SelectedStorageUnavailableError extends Error {
  /** Создаёт безопасное описание ошибки. */
  constructor() { super("Выбранное S3-хранилище недоступно"); }
}

/**
 * Возвращает ID выбранного S3 или null для локального режима.
 * @returns Идентификатор S3 либо null
 */
export async function selectedMediaStorageId(): Promise<string | null> {
  try {
    const registry = await ensureStorageRegistryLoaded();
    const configured = getUploadsStorageId();
    const backend = configured ? registry.resolveBackend(configured) : registry.getActiveBackend();
    if (configured && backend.backend !== "s3") throw new Error("Недоступно");
    if (backend.backend === "s3") {
      await ensureSelectedStorageAvailable(backend);
      return backend.configId;
    }
    return null;
  } catch {
    throw new SelectedStorageUnavailableError();
  }
}
