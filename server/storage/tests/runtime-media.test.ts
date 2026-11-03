/** @fileoverview Проверка проектного доступа и выбора хранилища медиа рабочего процесса. */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { Readable } from 'node:stream';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

vi.mock('../../database/db', () => ({ db: {} }));
vi.mock('../../storages/storage', () => ({ storage: {} }));
import { resolveRuntimeMedia } from '../resolve-runtime-media';
import { createMediaRuntimeToken } from '../media-runtime-token';
import { setupRuntimeMediaRoute } from '../../routes/media/runtime-media-route';

/** Проверяемые записи разных проектов и хранилищ. */
const rows = [
  { projectId: 12, url: '/uploads/12/a.jpg', filePath: '12/a.jpg', storageBackend: 's3', storageConfigId: 's3-one' },
  { projectId: 12, url: '/uploads/12/b.jpg', filePath: '12/b.jpg', storageBackend: 's3', storageConfigId: 's3-two' },
  { projectId: 12, url: '/uploads/12/c.jpg', filePath: 'uploads/12/c.jpg', storageBackend: 'local', storageConfigId: null },
  { projectId: 13, url: '/uploads/13/private.jpg', filePath: '13/private.jpg', storageBackend: 's3', storageConfigId: 's3-one' },
  { projectId: 12, url: '/api/storage/proxy/s3-one/12/old.jpg', filePath: '12/old.jpg', storageBackend: 's3', storageConfigId: 's3-one' },
  { projectId: 12, url: '/api/media/s3-proxy/s3-two/12/old.jpg', filePath: '12/old.jpg', storageBackend: 's3', storageConfigId: 's3-two' },
  { projectId: 13, url: 'https://cdn.example.org/secret.jpg', filePath: '13/secret.jpg', storageBackend: 's3', storageConfigId: 's3-one' },
  { projectId: 12, url: 'https://cdn.example.org/own.jpg', filePath: '12/own.jpg', storageBackend: 's3', storageConfigId: 's3-two' },
];
/** Поддельные независимые конфигурации. */
const backends = [{ configId: 's3-one', backend: 's3' }, { configId: 's3-two', backend: 's3' }, { configId: 'local-default', backend: 'local' }];
/** Зависимости поиска, включая имитацию отсутствующего проекта. */
const deps = {
  storage: { getMediaFilesByUrls: async (urls: string[], projectId: number) => rows.filter(row => row.projectId === projectId && urls.includes(row.url)) },
  ensureStorageRegistryLoaded: async () => ({ list: () => backends }),
  isRegisteredMediaUrl: async (url: string) => rows.some(row => row.url === url),
} as unknown as Parameters<typeof resolveRuntimeMedia>[2];

describe('resolver медиа проекта', () => {
  it('использует хранилище записи, включая старую локальную запись', async () => {
    expect((await resolveRuntimeMedia(12, rows[0].url, deps)).backend.configId).toBe('s3-one');
    expect((await resolveRuntimeMedia(12, rows[1].url, deps)).backend.configId).toBe('s3-two');
    expect((await resolveRuntimeMedia(12, rows[2].url, deps)).backend.configId).toBe('local-default');
    expect((await resolveRuntimeMedia(12, rows[4].url, deps)).backend.configId).toBe('s3-one');
    expect((await resolveRuntimeMedia(12, rows[5].url, deps)).backend.configId).toBe('s3-two');
    expect((await resolveRuntimeMedia(12, rows[7].url, deps)).backend.configId).toBe('s3-two');
  });
  it('отклоняет чужой проект, внешний адрес, обход пути и несуществующее хранилище', async () => {
    for (const url of ['/uploads/13/private.jpg', 'https://example.org/uploads/12/a.jpg', '/uploads/../secret']) {
      await expect(resolveRuntimeMedia(12, url, deps)).rejects.toMatchObject({ status: 404 });
    }
    const unavailable = { ...deps, ensureStorageRegistryLoaded: async () => ({ list: () => [] }) } as unknown as typeof deps;
    await expect(resolveRuntimeMedia(12, rows[0].url, unavailable)).rejects.toMatchObject({ status: 502 });
    await expect(resolveRuntimeMedia(12, rows[6].url, deps)).rejects.toMatchObject({ status: 404, code: 'MEDIA_NOT_FOUND' });
    await expect(resolveRuntimeMedia(12, 'https://external.example.org/a.jpg', deps)).rejects.toMatchObject({ status: 404, code: 'MEDIA_NOT_MANAGED' });
  });
});

describe('маршрут рабочего процесса', () => {
  let server: Server;
  let base: string;
  beforeAll(async () => {
    process.env.MEDIA_RUNTIME_SECRET = '0123456789abcdef0123456789abcdef';
    const app = express();
    setupRuntimeMediaRoute(app, {
      resolve: ((projectId, url) => resolveRuntimeMedia(projectId, url, deps)) as typeof resolveRuntimeMedia,
      open: (async () => ({ size: 4, version: 'v1', mime: 'image/jpeg', stream: async () => Readable.from(['data']) })) as never,
    });
    server = app.listen(0);
    await new Promise<void>(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/runtime/media`;
  });
  afterAll(() => { server.closeAllConnections(); server.close(); delete process.env.MEDIA_RUNTIME_SECRET; });
  it('выдаёт поток и версию только с токеном своего проекта', async () => {
    const url = `${base}?projectId=12&url=${encodeURIComponent(rows[0].url)}`;
    const headers = { Authorization: `Bearer ${createMediaRuntimeToken(12)}` };
    const head = await fetch(url, { method: 'HEAD', headers });
    expect(head.status).toBe(200); expect(head.headers.get('etag')).toBeTruthy(); expect(head.headers.get('content-length')).toBe('4');
    const get = await fetch(url, { headers }); expect(await get.text()).toBe('data');
    expect((await fetch(url, { headers: { Authorization: `Bearer ${createMediaRuntimeToken(13)}` } })).status).toBe(401);
    expect((await fetch(`${base}?projectId=12&url=${encodeURIComponent(rows[3].url)}`, { headers })).status).toBe(404);
  });
  it('отдаёт 502 при недоступном источнике без устаревшего Content-Length', async () => {
    const app = express();
    setupRuntimeMediaRoute(app, {
      resolve: ((projectId, url) => resolveRuntimeMedia(projectId, url, deps)) as typeof resolveRuntimeMedia,
      open: (async () => ({ size: 4, version: 'v1', mime: 'image/jpeg', stream: async () => { throw new Error('storage unavailable'); } })) as never,
    });
    const temporary = app.listen(0);
    await new Promise<void>(resolve => temporary.once('listening', resolve));
    try {
      const address = (temporary.address() as AddressInfo).port;
      const response = await fetch(`http://127.0.0.1:${address}/api/runtime/media?projectId=12&url=${encodeURIComponent(rows[0].url)}`, {
        headers: { Authorization: `Bearer ${createMediaRuntimeToken(12)}` },
      });
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: 'MEDIA_UNAVAILABLE' });
    } finally { temporary.closeAllConnections(); temporary.close(); }
  });
});
