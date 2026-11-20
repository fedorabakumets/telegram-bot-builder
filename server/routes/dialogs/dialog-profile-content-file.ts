/** @fileoverview Выдача сохранённого фото профиля без раскрытия адреса и параметров хранилища. */
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { pool } from '../../database/db';
import { resolveRuntimeMedia, openRuntimeMedia } from '../../storage/resolve-runtime-media';
import { PROFILE_CONTENT_SCOPE_SQL, profileContentParams, type ProfileContentScope } from './dialog-profile-content-store';

/** Проверяет связь фото с сообщением профиля и передаёт только байты сохранённого изображения. @param req - Запрос. @param res - Ответ. @param scope - Проверенная область. @returns Завершение передачи. */
export async function serveProfilePhoto(req: Request, res: Response, scope: ProfileContentScope): Promise<void> {
  const mediaId = Number(req.params.mediaId);
  if (!Number.isSafeInteger(mediaId) || mediaId < 1) { res.status(400).end(); return; }
  const controller = new AbortController();
  res.once('close', () => controller.abort());
  try {
    const { rows } = await pool.query(`SELECT DISTINCT f.id,f.url FROM bot_messages m
      JOIN bot_message_media mm ON mm.message_id=m.id JOIN media_files f ON f.id=mm.media_file_id AND f.project_id=m.project_id
      WHERE ${PROFILE_CONTENT_SCOPE_SQL} AND f.id=$5 AND f.mime_type IN ('image/jpeg','image/png','image/webp','image/gif') LIMIT 1`,
    [...profileContentParams(scope), mediaId]);
    if (!rows[0]) { res.status(404).end(); return; }
    const resolved = await resolveRuntimeMedia(scope.projectId, rows[0].url);
    const object = await openRuntimeMedia(resolved, controller.signal);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(object.mime ?? '') || object.size > 30 * 1024 * 1024) {
        res.status(422).end(); return;
      }
      res.set({ 'Content-Type': object.mime!, 'Content-Length': String(object.size),
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" });
      await pipeline(await object.stream(), res);
    } finally { await object.close?.().catch(() => undefined); }
  } catch { if (!res.destroyed) { if (res.headersSent) res.destroy(); else res.status(503).end(); } }
}
