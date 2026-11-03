/** @fileoverview Проверки очистки объекта при ошибке регистрации метаданных. */
import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { createMediaFile: mocks.create } }));
import { createRegisteredUpload } from './create-registered-upload';

describe('регистрация загрузки', () => {
  it('удаляет S3 объект при ошибке базы и сохраняет исходную ошибку', async () => {
    const failure = new Error('database unavailable');
    mocks.create.mockRejectedValueOnce(failure);
    const remove = vi.fn().mockResolvedValue(undefined);
    const backend = { configId: 's3-1', delete: remove } as any;
    const persisted = { filePath: '42/a.jpg', url: '/uploads/42/a.jpg', storageBackend: 's3', storageConfigId: 's3-1' };
    await expect(createRegisteredUpload(backend, persisted, {} as any)).rejects.toBe(failure);
    expect(remove).toHaveBeenCalledWith('42/a.jpg');
  });
  it('удаляет локальный объект по относительному ключу', async () => {
    mocks.create.mockRejectedValueOnce(new Error('database unavailable'));
    const remove = vi.fn().mockResolvedValue(undefined);
    await expect(createRegisteredUpload({ configId: 'local-default', delete: remove } as any,
      { filePath: 'uploads/42/a.jpg', url: '/uploads/42/a.jpg', storageBackend: 'local', storageConfigId: 'local-default' }, {} as any)).rejects.toThrow();
    expect(remove).toHaveBeenCalledWith('42/a.jpg');
  });
});
