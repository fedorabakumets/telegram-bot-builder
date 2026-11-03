/** @fileoverview Публичная совместимая выдача зарегистрированных /uploads из их S3. */
import type { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { mediaFiles } from '@shared/schema';
import { db } from '../../database/db';
import { ensureStorageRegistryLoaded } from '../../storage/storage-registry';
import { sendStoredObject } from '../../storage/send-stored-object';
import { uploadKeyFromUrl } from '../../storage/uploads-storage';
import { openRuntimeMedia, resolveRuntimeMedia } from '../../storage/resolve-runtime-media';
import { pipeline } from 'node:stream/promises';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';
import { storage } from '../../storages/storage';
import type { Request } from 'express';
import type { StorageBackend } from '../../storage/storage-backend';

/** Зависимости поиска публичного объекта. */
export interface RegisteredUploadsDeps {
  /** Поиск точного URL */
  find: (url: string) => Promise<Array<{
    /** Проект, которому принадлежит запись */
    projectId?: number;
    /** Признак явно публичного файла */
    isPublic?: number | null;
    /** Тип хранилища */
    storageBackend: string;
    /** Конфигурация хранилища */
    storageConfigId: string | null;
    /** Путь либо ключ объекта */
    filePath: string;
  }>>;
  /** Доступные бэкенды */
  list: () => Promise<StorageBackend[]>;
  /** Проверка доступа к приватному файлу */
  canAccess: (req: Request, projectId: number) => Promise<boolean>;
}

/** Реальные зависимости поиска и реестра. */
const defaults: RegisteredUploadsDeps = {
  find: url => db.select().from(mediaFiles).where(eq(mediaFiles.url, url)).limit(2),
  list: async () => (await ensureStorageRegistryLoaded()).list(),
  canAccess: async (req, projectId) => {
    const owner = getOwnerIdFromRequest(req);
    return owner !== null && storage.hasProjectAccess(projectId, owner);
  },
};

/** Создаёт запасную выдачу, определяя хранилище по точной записи файла.
 * @returns Обработчик публичного исторического адреса
 */
export function createRegisteredUploadsFallback(deps: RegisteredUploadsDeps = defaults): RequestHandler {
  return async (req, res, next) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const url = req.originalUrl.split('?')[0];
    if (!uploadKeyFromUrl(url)) { res.status(404).end(); return; }
    try {
      const rows = await deps.find(url);
      // Один публичный URL не должен разрешаться в разные файлы проектов.
      if (rows.length === 0) return next();
      if (rows.length !== 1) { res.status(404).end(); return; }
      const row = rows[0];
      if (row.isPublic !== 1 && (!row.projectId || !await deps.canAccess(req, row.projectId))) { res.status(404).end(); return; }
      if (row.storageBackend === 'local') {
        // Локальный источник берётся из записи, а не из совпавшего пути статики.
        if (!row.projectId) { res.status(404).end(); return; }
        const object = await openRuntimeMedia(await resolveRuntimeMedia(row.projectId, url), controller.signal);
        res.setHeader('Content-Type', object.mime || 'application/octet-stream');
        res.setHeader('Content-Length', object.size);
        res.setHeader('Cache-Control', row.isPublic === 1 ? 'public, max-age=86400' : 'private, no-store');
        if (req.method === 'HEAD') { await object.close?.(); res.end(); return; }
        const stream = await object.stream();
        try { await pipeline(stream, res); } finally { await object.close?.().catch(() => undefined); }
        return;
      }
      if (row.storageBackend !== 's3' || !row.storageConfigId) { res.status(404).end(); return; }
      const backend = (await deps.list()).find(item => item.configId === row.storageConfigId && item.backend === 's3');
      if (!backend) { res.status(502).end(); return; }
      const key = row.filePath;
      if (!key || key.split('/').some(part => !part || part === '.' || part === '..') || /[\\\u0000-\u001f]/.test(key)) { res.status(404).end(); return; }
      await sendStoredObject(req, res, backend, key, row.isPublic === 1 ? 'public' : 'private');
    } catch (error) { next(error); }
  };
}
