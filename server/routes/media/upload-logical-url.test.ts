/** @fileoverview Проверки логического адреса загрузок независимо от выбранного S3. */
import { describe, it, expect, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
vi.mock('../../database/db', () => ({ db: {} }));
import { persistUploadToBackend, resolveUploadBackend } from './upload-storage-helper';

describe('адреса выбранного хранилища', () => {
  it('выбирает настроенный S3 при загрузке файла', () => {
    const previous = process.env.UPLOADS_STORAGE_ID;
    process.env.UPLOADS_STORAGE_ID = 's3-selected';
    const backend = { backend: 's3', configId: 's3-selected', readOnly: false };
    const resolveBackend = vi.fn().mockReturnValue(backend);
    try {
      expect(resolveUploadBackend({ resolveBackend } as any, null)).toBe(backend);
      expect(resolveBackend).toHaveBeenCalledWith('s3-selected');
    } finally {
      if (previous === undefined) delete process.env.UPLOADS_STORAGE_ID;
      else process.env.UPLOADS_STORAGE_ID = previous;
    }
  });
  it('возвращает логический URL при произвольном S3 без UPLOADS_STORAGE_ID', async () => {
    const dir = path.join(process.cwd(), 'uploads', '42', randomUUID());
    const file = path.join(dir, 'photo.jpg');
    await mkdir(dir, { recursive: true }); await writeFile(file, 'image');
    const key = `42/${path.basename(dir)}/photo.jpg`;
    const backend = { backend: 's3', configId: 'other-s3', put: vi.fn().mockResolvedValue({ backend: 's3', configId: 'other-s3', key, url: 'https://example.com/expiring', size: 5 }) } as any;
    try {
      const result = await persistUploadToBackend(backend, { path: file, mimetype: 'image/jpeg' } as any, file, `/uploads/${key}`);
      expect(result.url).toBe(`/uploads/${key}`);
      expect(result.filePath).toBe(key);
      expect(result.storageConfigId).toBe('other-s3');
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
