/**
 * @fileoverview Запасная раздача `/uploads/*` из S3: если файла нет на диске,
 * панель читает его из хранилища загрузок `UPLOADS_STORAGE_ID` по тому же ключу,
 * но только если ключ зарегистрирован в `media_files`. Сессия не требуется.
 * Подключается после `express.static` для `/uploads`.
 * @module server/routes/media/uploads-s3-fallback
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";

import { sendStoredObject } from "../../storage/send-stored-object";
import type { StorageBackend } from "../../storage/storage-backend";
import { findUploadsBackend, getUploadsStorageId, uploadKeyFromPath } from "../../storage/uploads-storage";
import { findRegisteredMediaKeyFromDb, type MediaKeyQuery } from "./registered-media-key";

/** Зависимости middleware (подменяются в тестах) */
export interface UploadsFallbackDeps {
  /** ID хранилища загрузок либо null, если запасное чтение выключено */
  storageId: () => string | null;
  /** Список всех бэкендов реестра хранилищ */
  listBackends: () => Promise<StorageBackend[]>;
  /** Строка media_files для ключа либо null, если ключ не зарегистрирован */
  findMedia: MediaKeyQuery;
}

/** Зависимости по умолчанию: окружение и реестр хранилищ панели */
const defaultDeps: UploadsFallbackDeps = {
  storageId: () => getUploadsStorageId(),
  listBackends: async () => {
    const { ensureStorageRegistryLoaded } = await import("../../storage/storage-registry");
    return (await ensureStorageRegistryLoaded()).list();
  },
  findMedia: findRegisteredMediaKeyFromDb,
};

/**
 * Создаёт middleware запасной раздачи `/uploads` из S3.
 * Без `UPLOADS_STORAGE_ID` пропускает запрос дальше без изменений.
 * Ключ без строки media_files отвечает 404 и бакет не читает.
 * @param deps - Зависимости (окружение и реестр)
 * @returns Обработчик Express для монтирования на `/uploads`
 */
export function createUploadsS3Fallback(deps: UploadsFallbackDeps = defaultDeps): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const storageId = deps.storageId();
    if (!storageId) return next();

    const key = uploadKeyFromPath(req.path);
    if (!key) {
      res.status(404).end();
      return;
    }

    try {
      const media = await deps.findMedia(storageId, key);
      if (!media) {
        res.status(404).end();
        return;
      }
      const backend = findUploadsBackend(await deps.listBackends(), storageId);
      if (!backend) {
        console.warn(`[Uploads] Хранилище загрузок "${storageId}" не найдено среди S3-хранилищ`);
        return next();
      }
      await sendStoredObject(req, res, backend, key);
    } catch (err) {
      next(err);
    }
  };
}
