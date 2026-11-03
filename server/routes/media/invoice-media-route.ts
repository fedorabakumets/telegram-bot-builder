/** @fileoverview Короткие ссылки на изображения счетов с доступом к одному объекту. */
import type { Express } from 'express';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { storage } from '../../storages/storage';
import { verifyMediaRuntimeToken } from '../../storage/media-runtime-token';
import { resolveRuntimeMedia, openRuntimeMedia } from '../../storage/resolve-runtime-media';
import { INVOICE_LINK_TTL, signInvoiceMedia, verifyInvoiceMedia } from './invoice-media-signature';

/** Максимальный размер изображения счёта. */
const MAX_BYTES = 10 * 1024 * 1024;
/** Подменяемые зависимости для проверки маршрута. */
export interface InvoiceMediaDeps {
  /** Поиск медиа по идентификатору */
  getFile: typeof storage.getMediaFile;
  /** Поиск зарегистрированного объекта проекта */
  resolve: typeof resolveRuntimeMedia;
  /** Открытие объекта */
  open: typeof openRuntimeMedia;
}

/**
 * Регистрирует выдачу и использование временных ссылок.
 * @param app - Приложение панели
 * @param deps - Зависимости маршрута
 */
export function setupInvoiceMediaRoute(app: Express, deps: InvoiceMediaDeps = { getFile: id => storage.getMediaFile(id), resolve: resolveRuntimeMedia, open: openRuntimeMedia }): void {
  app.post('/api/runtime/media/invoice-link', async (req, res) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    try {
      const projectId = Number(req.query.projectId);
      const token = /^Bearer ([0-9a-f]{64})$/i.exec(req.header('authorization') ?? '')?.[1] ?? '';
      if (!Number.isSafeInteger(projectId) || projectId < 1 || !verifyMediaRuntimeToken(projectId, token)) return res.status(401).end();
      if (typeof req.body?.url !== 'string' || req.body.url.length > 8192) return res.status(400).end();
      const base = new URL(process.env.MEDIA_PUBLIC_BASE_URL || '');
      if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) return res.status(503).json({ error: 'MEDIA_PUBLIC_URL_UNAVAILABLE' });
      const resolved = await deps.resolve(projectId, req.body.url);
      const object = await deps.open(resolved, controller.signal);
      try {
        if (!['image/jpeg', 'image/png'].includes(object.mime || '') || object.size < 1 || object.size > MAX_BYTES) return res.status(422).json({ error: 'MEDIA_INVALID_IMAGE' });
        const expires = Math.floor(Date.now() / 1000) + INVOICE_LINK_TTL;
        const url = new URL(`/api/runtime/media/invoice/${projectId}/${resolved.media.id}`, base);
        url.searchParams.set('expires', String(expires));
        url.searchParams.set('signature', signInvoiceMedia(projectId, resolved.media.id, expires));
        return res.json({ url: url.toString(), expiresAt: expires });
      } finally { await object.close?.().catch(() => undefined); }
    } catch { if (!res.destroyed) return res.status(503).json({ error: 'MEDIA_UNAVAILABLE' }); }
  });

  app.get('/api/runtime/media/invoice/:projectId/:mediaId', async (req, res) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    try {
      const projectId = Number(req.params.projectId), mediaId = Number(req.params.mediaId), expires = Number(req.query.expires);
      if (!verifyInvoiceMedia(projectId, mediaId, expires, String(req.query.signature || ''))) return res.status(403).end();
      const media = await deps.getFile(mediaId);
      if (!media || media.projectId !== projectId) return res.status(404).end();
      const resolved = await deps.resolve(projectId, media.url);
      if (resolved.media.id !== mediaId) return res.status(404).end();
      const object = await deps.open(resolved, controller.signal);
      try {
        if (!['image/jpeg', 'image/png'].includes(object.mime || '') || object.size < 1 || object.size > MAX_BYTES) return res.status(422).end();
        res.setHeader('Content-Type', object.mime!); res.setHeader('Content-Length', object.size);
        res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
        let bytes = 0;
        const limiter = new Transform({ transform(chunk, _encoding, callback) { bytes += chunk.length; callback(bytes > object.size || bytes > MAX_BYTES ? new Error('Превышен размер') : null, chunk); } });
        await pipeline(await object.stream(), limiter, res);
      } finally { await object.close?.().catch(() => undefined); }
    } catch { if (res.destroyed) return; if (res.headersSent) res.destroy(); else res.status(503).end(); }
  });
}
