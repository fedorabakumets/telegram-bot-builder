/** @fileoverview Независимые проверки изоляции проектов и выбора хранилища оригиналов. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ rows: vi.fn(), list: vi.fn(), head: vi.fn(), get: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { getMediaFilesByUrls: fake.rows } }));
vi.mock('../storage-registry', () => ({ ensureStorageRegistryLoaded: async () => ({ list: fake.list }) }));
vi.mock('../../database/db', () => ({ db: {} }));
vi.mock('../s3-backend', () => ({ S3Backend: class {
  configId: string;
  backend = 's3';
  constructor(id: string) { this.configId = id; }
  headMetadata = fake.head;
  getIfMatch = fake.get;
} }));
import { S3Backend } from '../s3-backend';
import { openRuntimeMedia, resolveRuntimeMedia, runtimeMediaEtag } from '../resolve-runtime-media';
import { createMediaRuntimeToken, verifyMediaRuntimeToken } from '../media-runtime-token';

/** Создаёт зарегистрированный файл проекта для тестового S3. */
function record(projectId = 12, configId = 's3-old') {
  return { projectId, url: '/uploads/12/a.jpg', filePath: '12/a.jpg', storageConfigId: configId, storageBackend: 's3', mimeType: 'image/jpeg' };
}
beforeEach(() => {
  vi.clearAllMocks();
  fake.rows.mockResolvedValue([record()]);
  fake.list.mockReturnValue([new S3Backend('s3-old' as never), new S3Backend('s3-active' as never)]);
  fake.head.mockResolvedValue({ size: 7, version: 'v1', etag: 'etag-v1' });
});
describe('Оригинал медиа в runtime', () => {
  it('читает прежний S3 по записи, даже когда существует другой S3', async () => {
    const resolved = await resolveRuntimeMedia(12, '/uploads/12/a.jpg');
    expect(resolved.backend.configId).toBe('s3-old');
    const controller = new AbortController();
    const opened = await openRuntimeMedia(resolved, controller.signal);
    expect(opened.size).toBe(7);
    expect(fake.head).toHaveBeenCalledWith('12/a.jpg', controller.signal);
    await opened.stream();
    expect(fake.get).toHaveBeenCalledWith('12/a.jpg', 'etag-v1', controller.signal);
  });
  it('запрещает файл другого проекта даже при совпадении ссылки', async () => {
    fake.rows.mockResolvedValue([record(13)]);
    await expect(resolveRuntimeMedia(12, '/uploads/12/a.jpg')).rejects.toThrow();
    expect(fake.head).not.toHaveBeenCalled();
  });
  it.each(['/uploads/../secret', '/uploads/12/%2e%2e/secret', '/uploads/12/a.jpg?x=1', 'https://example.org/uploads/12/a.jpg'])('отклоняет адрес %s', async value => {
    await expect(resolveRuntimeMedia(12, value)).rejects.toThrow();
    expect(fake.head).not.toHaveBeenCalled();
  });
  it('не подменяет недоступное хранилище активным', async () => {
    fake.list.mockReturnValue([new S3Backend('s3-active' as never)]);
    await expect(resolveRuntimeMedia(12, '/uploads/12/a.jpg')).rejects.toMatchObject({ status: 502 });
    expect(fake.head).not.toHaveBeenCalled();
  });
  it('версия оригинала влияет на ETag', () => {
    expect(runtimeMediaEtag('v1')).not.toBe(runtimeMediaEtag('v2'));
    expect(runtimeMediaEtag('v1')).toBe(runtimeMediaEtag('v1'));
  });
});
describe('Токен доступа к оригиналам', () => {
  it('привязан к проекту и отвергает подделку', () => {
    const previous = process.env.MEDIA_RUNTIME_SECRET;
    process.env.MEDIA_RUNTIME_SECRET = 'test-secret-with-at-least-32-characters';
    try {
      const token = createMediaRuntimeToken(12);
      expect(verifyMediaRuntimeToken(12, token)).toBe(true);
      expect(verifyMediaRuntimeToken(13, token)).toBe(false);
      expect(verifyMediaRuntimeToken(12, 'x')).toBe(false);
    } finally { if (previous === undefined) delete process.env.MEDIA_RUNTIME_SECRET; else process.env.MEDIA_RUNTIME_SECRET = previous; }
  });
});
