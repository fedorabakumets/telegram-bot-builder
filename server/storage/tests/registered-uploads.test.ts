/** @fileoverview Проверка публичного просмотра S3 по записи файла. */
import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import { Readable } from 'node:stream';
import type { AddressInfo } from 'node:net';
import type { StorageBackend } from '../storage-backend';
vi.mock('../../database/db', () => ({ db: {} }));
vi.mock('../../storages/storage', () => ({ storage: {} }));
import { createRegisteredUploadsFallback } from '../../routes/media/registered-uploads-fallback';
import { authMiddleware } from '../../telegram/auth-middleware';

describe('публичный просмотр /uploads', () => {
  it('читает S3 из записи, без зависимости от активного хранилища', async () => {
    const calls: string[] = [];
    const backend = (id: string) => ({ configId: id, backend: 's3', get: async (key: string) => { calls.push(`${id}:${key}`); return Readable.from(['jpeg']); } }) as StorageBackend;
    const app = express();
    app.use(session({ secret: 'test-session-secret', resave: false, saveUninitialized: false }));
    app.get('/login', (req, res) => { req.session.telegramUser = { id: 12 } as never; res.send('ok'); });
    app.use('/uploads', authMiddleware);
    app.use('/uploads', createRegisteredUploadsFallback({
      find: async url => url === '/uploads/12/a.jpg' ? [{ projectId: 12, isPublic: 1, storageBackend: 's3', storageConfigId: 's3-two', filePath: '12/a.jpg' }]
        : url === '/uploads/12/private.jpg' ? [{ projectId: 12, isPublic: 0, storageBackend: 's3', storageConfigId: 's3-two', filePath: '12/private.jpg' }] : [],
      list: async () => [backend('s3-one'), backend('s3-two')],
      canAccess: async req => req.user?.id === 12,
    }));
    // Поддельная статика показывает, что совпадающий локальный путь не побеждает S3.
    app.use('/uploads', (_req, res) => res.status(200).send('local'));
    const server = app.listen(0);
    await new Promise<void>(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const response = await fetch(`${base}/uploads/12/a.jpg`);
      expect(response.status).toBe(200); expect(await response.text()).toBe('jpeg');
      expect(calls).toEqual(['s3-two:12/a.jpg']);
      expect((await fetch(`${base}/uploads/12/private.jpg`)).status).toBe(404);
      const login = await fetch(`${base}/login`);
      const cookie = login.headers.get('set-cookie')!.split(';')[0];
      const privateResponse = await fetch(`${base}/uploads/12/private.jpg`, { headers: { cookie } });
      expect(privateResponse.status).toBe(200); expect(privateResponse.headers.get('cache-control')).toBe('private');
      expect(await (await fetch(`${base}/uploads/12/unknown.jpg`)).text()).toBe('local');
    } finally { server.closeAllConnections(); server.close(); }
  });
});
