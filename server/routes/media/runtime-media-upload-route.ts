/** @fileoverview Приём входящего фото от рабочего процесса конкретного проекта. */
import express, { type Express, type Request, type Response } from 'express';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { verifyMediaRuntimeWriteToken } from '../../storage/media-runtime-token';
import { ensureStorageRegistryLoaded } from '../../storage/storage-registry';
import { resolveUploadBackend, persistUploadToBackend } from './upload-storage-helper';
import { createRegisteredUpload } from './create-registered-upload';
import { incomingPhotoRetryAfter } from './incoming-photo-limit';
import { computeStorageQuota } from '../../storage/compute-quota';

/** Проверяет проектный токен до приёма тела запроса.
 * @param req - Запрос бота
 * @param res - Ответ при отказе
 * @param next - Продолжение обработки
 */
async function authorize(req: Request, res: Response, next: () => void): Promise<void> {
  const projectId = Number(req.query.projectId);
  const token = /^Bearer ([0-9a-f]{64})$/i.exec(req.header('authorization') ?? '')?.[1] ?? '';
  try {
    if (Number.isSafeInteger(projectId) && projectId > 0 && verifyMediaRuntimeWriteToken(projectId, token)) {
      const retryAfter = await incomingPhotoRetryAfter(projectId);
      if (retryAfter) { res.setHeader('Retry-After', retryAfter); res.status(429).json({ error: 'RATE_LIMITED', retryAfter }); return; }
      next(); return;
    }
  } catch { /* Ненастроенный секрет не разрешает доступ. */ }
  res.status(401).json({ error: 'UNAUTHORIZED' });
}

/** Регистрирует ограниченный маршрут приёма фото.
 * @param app - Приложение панели
 */
export function setupRuntimeMediaUploadRoute(app: Express): void {
  app.post('/api/runtime/media/incoming-photo', authorize, express.raw({ type: 'image/jpeg', limit: '20mb' }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length || req.body[0] !== 0xff || req.body[1] !== 0xd8) { res.status(400).json({ error: 'INVALID_PHOTO' }); return; }
    const projectId = Number(req.query.projectId);
    const date = new Date().toISOString().slice(0, 10);
    const name = `${randomUUID()}.jpg`;
    const dir = join(process.cwd(), 'uploads', String(projectId), date);
    const staged = join(dir, name);
    try {
      const backend = resolveUploadBackend(await ensureStorageRegistryLoaded(), undefined);
      await mkdir(dir, { recursive: true });
      await writeFile(staged, req.body);
      const url = `/uploads/${projectId}/${date}/${name}`;
      const persisted = await persistUploadToBackend(backend, { path: staged, mimetype: 'image/jpeg' } as Express.Multer.File, staged, url);
      const file = await createRegisteredUpload(backend, persisted, { projectId, fileName: name, fileType: 'photo', filePath: persisted.filePath, fileSize: req.body.length, mimeType: 'image/jpeg', url: persisted.url, storageBackend: persisted.storageBackend, storageConfigId: persisted.storageConfigId, isPublic: 0, tags: [] });
      const quota = await computeStorageQuota(projectId).catch(() => null);
      res.json({ id: file.id, url: file.url, quotaExceeded: quota?.quotaExceeded ?? null });
    } catch {
      await unlink(staged).catch(() => {});
      res.status(502).json({ error: 'STORAGE_UNAVAILABLE' });
    }
  });
}
