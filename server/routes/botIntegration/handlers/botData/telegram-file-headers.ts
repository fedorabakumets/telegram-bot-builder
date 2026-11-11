/** @fileoverview Заголовки потокового ответа Telegram с поддержкой приватного кэша. */
import type { Request, Response } from 'express';
import { setPrivateMediaCacheHeaders } from './set-private-media-cache';
/** Переносит заголовки успешного файла, сохраняя прежнее определение типа и имени.
 * @param req - Запрос браузера.
 * @param res - Ответ браузеру.
 * @param fileResp - Ответ Telegram.
 * @param filePath - Проверенный относительный путь.
 */
export function setTelegramFileHeaders(req: Request, res: Response, fileResp: globalThis.Response, filePath: string): void {
    // Пробрасываем заголовки от Telegram CDN клиенту
    let contentType = fileResp.headers.get("content-type") || "application/octet-stream";
    const contentLength = fileResp.headers.get("content-length");
    const contentRange = fileResp.headers.get("content-range");
    const acceptRanges = fileResp.headers.get("accept-ranges") || "bytes";

    // Определяем имя файла из query-параметра или file_path

    let fileName = (typeof req.query.fileName === "string" ? req.query.fileName.slice(0, 255) : "") || filePath.split('/').pop() || 'file';

    // Если Telegram отдаёт generic content-type — определяем из file_path
    if (contentType === "application/octet-stream") {
      const dir = filePath.split('/')[0];
      const ctMap: Record<string, string> = {
        'photos': 'image/jpeg', 'videos': 'video/mp4', 'animations': 'video/mp4',
        'voice': 'audio/ogg', 'video_notes': 'video/mp4', 'stickers': 'image/webp',
        'music': 'audio/mpeg',
      };
      if (ctMap[dir]) contentType = ctMap[dir];
    }

    // Если имя файла не содержит расширения — добавляем из content-type или file_path
    if (!fileName.includes('.')) {
      const extMap: Record<string, string> = {
        'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
        'video/mp4': '.mp4', 'video/webm': '.webm',
        'audio/mpeg': '.mp3', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a',
        'application/pdf': '.pdf', 'application/zip': '.zip',
      };
      // Определяем расширение из директории file_path (photos/ → .jpg, videos/ → .mp4)
      const dirMap: Record<string, string> = {
        'photos': '.jpg', 'videos': '.mp4', 'animations': '.mp4',
        'voice': '.ogg', 'video_notes': '.mp4', 'stickers': '.webp',
        'documents': '', 'music': '.mp3',
      };
      const dir = filePath.split('/')[0];
      const ext = extMap[contentType] || dirMap[dir] || '';
      fileName += ext;
    }

    res.status(fileResp.status);
    res.set("Content-Type", contentType);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set("Accept-Ranges", acceptRanges);
    setPrivateMediaCacheHeaders(res);
    /** Активные документы не должны исполняться под origin приложения. */
    const mediaType = contentType.split(';')[0].trim().toLowerCase();
    const safeInline = /^(image\/(jpeg|png|gif|webp|avif|bmp)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+)$/.test(mediaType);
    if (!safeInline) res.set('Content-Security-Policy', "sandbox; default-src 'none'");
    res.set("Content-Disposition", `${safeInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(fileName)}"`);

    if (contentLength) res.set("Content-Length", contentLength);
    if (contentRange) res.set("Content-Range", contentRange);


}
