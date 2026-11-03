/**
 * @fileoverview Загрузка изображения в выбранное хранилище проекта.
 */
import type { Request, Response } from 'express';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { downloadFileFromUrl } from '../../../files/downloadFileFromUrl';
import { storage } from '../../../storages/storage';
import { getOwnerIdFromRequest } from '../../../telegram/auth-middleware';
import { ensureStorageRegistryLoaded } from '../../../storage/storage-registry';
import { persistUploadToBackend, resolveUploadBackend, StorageBackendWriteError } from '../../media/upload-storage-helper';
import { createRegisteredUpload } from '../../media/create-registered-upload';

/** Загружает изображение из base64 или по внешнему адресу.
 * @param req - Запрос с проектом и изображением
 * @param res - Ответ с зарегистрированной ссылкой
 * @returns Результат обработки запроса
 */
export async function uploadImageHandler(req: Request, res: Response): Promise<void> {
  let staged: string | undefined;
  try {
    const { imageUrl, projectId, nodeName, imageBase64, storageConfigId } = req.body;
    if (!Number.isInteger(projectId) || projectId <= 0 || typeof nodeName !== 'string' || !nodeName) {
      res.status(400).json({ success: false, error: 'Необходимо указать projectId и nodeName' }); return;
    }
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
    if (!await storage.hasProjectAccess(projectId, ownerId)) { res.status(403).json({ success: false, error: 'Нет доступа к проекту' }); return; }
    const backend = resolveUploadBackend(await ensureStorageRegistryLoaded(), storageConfigId);
    const date = new Date().toISOString().slice(0, 10);
    const dir = path.join(process.cwd(), 'uploads', String(projectId), date);
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}-image.jpg`;
    staged = path.join(dir, name);
    let size: number;
    let mime = 'image/jpeg';
    if (typeof imageBase64 === 'string' && imageBase64) {
      if (imageBase64.length > 70 * 1024 * 1024) throw new Error('Превышен допустимый размер файла');
      const buffer = Buffer.from(imageBase64, 'base64');
      if (!buffer.length || buffer.length > 50 * 1024 * 1024) throw new Error('Недопустимый размер файла');
      size = buffer.length;
      await writeFile(staged, buffer);
    } else if (typeof imageUrl === 'string' && imageUrl) {
      const result = await downloadFileFromUrl(imageUrl, staged);
      if (!result.success) throw new Error(result.error || 'Ошибка загрузки');
      mime = result.mimeType || 'application/octet-stream';
      if (!mime.startsWith('image/')) throw new Error('Ссылка не содержит изображение');
      size = result.size || 0;
    } else { res.status(400).json({ success: false, error: 'Необходимо указать imageUrl или imageBase64' }); return; }
    const logicalUrl = `/uploads/${projectId}/${date}/${name}`;
    const persisted = await persistUploadToBackend(backend, { path: staged, mimetype: mime } as Express.Multer.File, staged, logicalUrl);
    const file = await createRegisteredUpload(backend, persisted, {
      projectId, fileName: name, fileType: 'photo', filePath: persisted.filePath, fileSize: size,
      mimeType: mime, url: persisted.url, storageBackend: persisted.storageBackend,
      storageConfigId: persisted.storageConfigId, description: nodeName, tags: [], isPublic: 0,
      uploadedBy: ownerId,
    });
    staged = undefined;
    res.json({ success: true, localPath: file.url, fileId: file.id, message: 'Изображение успешно загружено' });
  } catch (error) {
    if (staged) await unlink(staged).catch(() => {});
    res.status(error instanceof StorageBackendWriteError ? 502 : 400).json({ success: false, error: error instanceof StorageBackendWriteError ? 'Хранилище недоступно' : 'Не удалось загрузить изображение' });
  }
}
