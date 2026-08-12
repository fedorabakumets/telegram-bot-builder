/**
 * @fileoverview HTTP-заголовки браузерного кэша для медиа через /api
 * Перезаписывает глобальный no-store только для успешных бинарных ответов.
 * @module botIntegration/handlers/botData/set-private-media-cache
 */

import type { Response } from "express";

/**
 * Разрешает private-кэш медиа (аватарки, telegram-file) в браузере.
 * Снимает Pragma/Expires от глобального API middleware — иначе max-age игнорируется.
 * Вызывать только перед отправкой успешного изображения/файла, не на 4xx/5xx.
 * @param res - Ответ Express
 * @param maxAgeSeconds - TTL кэша в секундах (по умолчанию сутки)
 */
export function setPrivateMediaCacheHeaders(res: Response, maxAgeSeconds = 86400): void {
  res.set("Cache-Control", `private, max-age=${maxAgeSeconds}`);
  res.removeHeader("Pragma");
  res.removeHeader("Expires");
}
