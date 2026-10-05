/**
 * @fileoverview Маршрут `/api/media/s3-proxy/<configId>/<ключ>`: отдаёт объект
 * приватного S3 только если ключ есть в `media_files` и у личности есть доступ
 * к проекту этого файла. Совпадение с `UPLOADS_STORAGE_ID` само по себе доступ не даёт.
 * @module server/routes/media/s3-proxy-route
 */

import type { Express, Request, Response } from "express";

import { S3_PROXY_BASE } from "../../storage/s3-backend";
import { sendStoredObject } from "../../storage/send-stored-object";
import type { StorageBackend } from "../../storage/storage-backend";
import { getOwnerIdFromRequest } from "../../telegram/auth-middleware";
import { uploadKeyFromPath } from "../../storage/uploads-storage";
import { findRegisteredMediaKeyFromDb, type MediaKeyQuery } from "./registered-media-key";

/** Зависимости прокси: в тестах подменяются без Postgres и сессии */
export interface S3ProxyDeps {
  /** Строка media_files по хранилищу и ключу либо null */
  findMedia: MediaKeyQuery;
  /** Личность запроса: id пользователя или null */
  getOwnerId: (req: Request) => number | null;
  /** Доступ владельца или коллаборатора к проекту */
  hasProjectAccess: (projectId: number, ownerId: number) => Promise<boolean>;
  /** Бэкенды реестра хранилищ */
  listBackends: () => Promise<StorageBackend[]>;
}

/** Зависимости по умолчанию: БД, сессия и реестр панели */
const defaultDeps: S3ProxyDeps = {
  findMedia: findRegisteredMediaKeyFromDb,
  getOwnerId: getOwnerIdFromRequest,
  hasProjectAccess: async (projectId, ownerId) => {
    const { storage } = await import("../../storages/storage");
    return storage.hasProjectAccess(projectId, ownerId);
  },
  listBackends: async () => {
    const { ensureStorageRegistryLoaded } = await import("../../storage/storage-registry");
    return (await ensureStorageRegistryLoaded()).list();
  },
};

/**
 * Проверяет личность и проект файла, затем стримит объект с приватным кэшем.
 * Без личности — 401, нет строки — 404, нет доступа — 403 (как requireMediaFileOwnership).
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @param deps - Поиск строки, личность, доступ и реестр
 * @returns Promise завершения ответа
 */
async function handleS3Proxy(req: Request, res: Response, deps: S3ProxyDeps): Promise<void> {
  const configId = req.params.configId;
  const key = uploadKeyFromPath(req.params[0] ?? "");
  if (!configId || !key) {
    res.status(404).end();
    return;
  }

  const ownerId = deps.getOwnerId(req);
  if (ownerId === null) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const media = await deps.findMedia(configId, key);
  if (!media) {
    res.status(404).json({ message: "Медиафайл не найден" });
    return;
  }

  const hasAccess = await deps.hasProjectAccess(media.projectId, ownerId);
  if (!hasAccess) {
    res.status(403).json({ message: "Нет прав доступа к проекту" });
    return;
  }

  const backend = (await deps.listBackends()).find((item) => item.configId === configId && item.backend === "s3");
  if (!backend) {
    res.status(404).end();
    return;
  }
  await sendStoredObject(req, res, backend, key, "private");
}

/**
 * Регистрирует маршрут S3-прокси.
 * @param app - Приложение Express
 * @param deps - Зависимости (по умолчанию БД и сессия панели)
 */
export function setupS3ProxyRoute(app: Express, deps: S3ProxyDeps = defaultDeps): void {
  app.get(`${S3_PROXY_BASE}/:configId/*`, (req, res, next) => {
    handleS3Proxy(req, res, deps).catch(next);
  });
}
