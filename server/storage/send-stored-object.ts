/**
 * @fileoverview Отдача объекта из хранилища (S3 или диск) в HTTP-ответ:
 * Content-Type по расширению, кэш (публичный по умолчанию, private по запросу),
 * HEAD без тела, 404 при отсутствии.
 * @module server/storage/send-stored-object
 */

import { pipeline } from "stream";
import type { Request, Response } from "express";

import { isS3NotFound } from "./s3-backend";
import type { StorageBackend } from "./storage-backend";
import { contentTypeForKey } from "./uploads-storage";

/** Режим кэша: public — сутки для /uploads, private — только для прокси */
export type StoredObjectCacheMode = "public" | "private";

/** Общий кэш загрузок (сутки). Для прокси не используется */
const PUBLIC_CACHE_CONTROL = "public, max-age=86400";

/** Приватный кэш прокси: без общего кэша */
const PRIVATE_CACHE_CONTROL = "private";

/**
 * Проверяет, означает ли ошибка отсутствие объекта (S3 404 либо ENOENT на диске).
 * @param err - Ошибка чтения
 * @returns true, если объекта нет
 */
function isNotFound(err: unknown): boolean {
  return isS3NotFound(err) || (err as NodeJS.ErrnoException)?.code === "ENOENT";
}

/**
 * Стримит объект хранилища в ответ.
 * @param req - Входящий запрос (нужен метод для HEAD)
 * @param res - Ответ Express
 * @param backend - Бэкенд, из которого читается объект
 * @param key - Ключ объекта
 * @param cache - Режим Cache-Control; по умолчанию публичные сутки
 * @returns Promise, который завершается после отправки ответа
 */
export async function sendStoredObject(
  req: Request,
  res: Response,
  backend: StorageBackend,
  key: string,
  cache: StoredObjectCacheMode = "public",
): Promise<void> {
  let stream: NodeJS.ReadableStream;
  try {
    stream = await backend.get(key);
  } catch (err) {
    if (isNotFound(err)) {
      res.status(404).end();
      return;
    }
    console.error(`[Uploads] Ошибка чтения "${key}" из хранилища ${backend.configId}:`, (err as Error)?.message);
    res.status(502).end();
    return;
  }

  res.setHeader("Content-Type", contentTypeForKey(key));
  res.setHeader("Cache-Control", cache === "private" ? PRIVATE_CACHE_CONTROL : PUBLIC_CACHE_CONTROL);
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "HEAD") {
    (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
    res.end();
    return;
  }

  await new Promise<void>((resolve) => {
    pipeline(stream, res, (err) => {
      if (err && !res.headersSent) {
        res.status(isNotFound(err) ? 404 : 502).end();
      }
      resolve();
    });
  });
}
