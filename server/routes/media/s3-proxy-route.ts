/**
 * @fileoverview Маршрут `/api/media/s3-proxy/<configId>/<ключ>`: отдаёт объект
 * приватного S3-бакета. Разрешены только хранилище загрузок (`UPLOADS_STORAGE_ID`)
 * и файлы, зарегистрированные в `media_files`, — чтобы через прокси нельзя было
 * читать сборки ботов, бэкапы и прочие бакеты.
 * @module server/routes/media/s3-proxy-route
 */

import { and, eq } from "drizzle-orm";
import type { Express, Request, Response } from "express";

import { mediaFiles } from "@shared/schema";

import { db } from "../../database/db";
import { S3_PROXY_BASE } from "../../storage/s3-backend";
import { sendStoredObject } from "../../storage/send-stored-object";
import { ensureStorageRegistryLoaded } from "../../storage/storage-registry";
import { getUploadsStorageId, uploadKeyFromPath } from "../../storage/uploads-storage";

/**
 * Проверяет, зарегистрирован ли объект в media_files для данного хранилища.
 * @param configId - ID хранилища
 * @param key - Ключ объекта
 * @returns true, если такой файл есть в media_files
 */
async function isRegisteredMedia(configId: string, key: string): Promise<boolean> {
  const rows = await db
    .select({ id: mediaFiles.id })
    .from(mediaFiles)
    .where(and(eq(mediaFiles.storageConfigId, configId), eq(mediaFiles.filePath, key)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Обработчик прокси: проверяет доступ и стримит объект.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise завершения ответа
 */
async function handleS3Proxy(req: Request, res: Response): Promise<void> {
  const configId = req.params.configId;
  const key = uploadKeyFromPath(req.params[0] ?? "");
  if (!configId || !key) {
    res.status(404).end();
    return;
  }

  const allowed = configId === getUploadsStorageId() || (await isRegisteredMedia(configId, key));
  if (!allowed) {
    res.status(404).end();
    return;
  }

  const registry = await ensureStorageRegistryLoaded();
  const backend = registry.list().find((b) => b.configId === configId && b.backend === "s3");
  if (!backend) {
    res.status(404).end();
    return;
  }
  await sendStoredObject(req, res, backend, key);
}

/**
 * Регистрирует маршрут S3-прокси.
 * @param app - Приложение Express
 */
export function setupS3ProxyRoute(app: Express): void {
  app.get(`${S3_PROXY_BASE}/:configId/*`, (req, res, next) => {
    handleS3Proxy(req, res).catch(next);
  });
}
