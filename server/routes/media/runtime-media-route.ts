/** @fileoverview Защищённая потоковая выдача медиа рабочего процесса бота. */
import type { Express, Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { verifyMediaRuntimeToken } from '../../storage/media-runtime-token';
import { openRuntimeMedia, resolveRuntimeMedia, runtimeMediaEtag } from '../../storage/resolve-runtime-media';

/** Обрабатывает запрос к файлу проекта с отдельным токеном.
 * @param req - Запрос рабочего процесса
 * @param res - Поток ответа
 */
async function handleRuntimeMedia(req: Request, res: Response, deps: RuntimeMediaDeps): Promise<void> {
  const controller = new AbortController();
  res.once('close', () => controller.abort());
  const projectId = Number(req.query.projectId);
  const token = /^Bearer ([0-9a-f]{64})$/i.exec(req.header('authorization') ?? '')?.[1] ?? '';
  if (!Number.isSafeInteger(projectId) || projectId < 1) { res.status(400).end(); return; }
  if (!verifyMediaRuntimeToken(projectId, token)) { res.status(401).end(); return; }
  if (typeof req.query.url !== 'string') { res.status(400).end(); return; }
  const object = await deps.open(await deps.resolve(projectId, req.query.url), controller.signal);
  res.setHeader('Content-Type', object.mime || 'application/octet-stream');
  res.setHeader('Content-Length', object.size);
  res.setHeader('ETag', runtimeMediaEtag(object.version));
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'HEAD') { await object.close?.(); res.end(); return; }
  const stream = await object.stream();
  try { await pipeline(stream, res); } finally { await object.close?.().catch(() => undefined); }
}

/** Регистрирует маршрут чтения медиа для ботов.
 * @param app - Приложение панели
 */
/** Зависимости маршрута для проверки доступа и выдачи объекта. */
export interface RuntimeMediaDeps {
  /** Поиск файла в проекте */
  resolve: typeof resolveRuntimeMedia;
  /** Открытие найденного файла */
  open: typeof openRuntimeMedia;
}

export function setupRuntimeMediaRoute(app: Express, deps: RuntimeMediaDeps = { resolve: resolveRuntimeMedia, open: openRuntimeMedia }): void {
  app.all('/api/runtime/media', (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.status(405).end(); return; }
    handleRuntimeMedia(req, res, deps).catch((error: NodeJS.ErrnoException & { status?: number; name?: string }) => {
      if (res.headersSent) { res.destroy(); return; }
      res.removeHeader('Content-Length');
      res.removeHeader('ETag');
      const missing = error.code === 'ENOENT' || ['NoSuchKey', 'NotFound'].includes(error.name ?? '');
      const code = error.code === 'MEDIA_NOT_MANAGED' ? 'MEDIA_NOT_MANAGED' : missing || error.status === 404 ? 'MEDIA_NOT_FOUND' : 'MEDIA_UNAVAILABLE';
      res.setHeader('X-Media-Error', code);
      res.status(error.status ?? (missing ? 404 : 502)).json({ error: code });
    });
  });
}
