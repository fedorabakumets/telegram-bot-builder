/** @fileoverview Проверка краткоживущего доступа к изображению счёта. */
import { describe, expect, it } from 'vitest';
import express from 'express';
import { Readable } from 'node:stream';
import { request } from 'node:http';
import { createMediaRuntimeToken } from '../media-runtime-token';
import { setupInvoiceMediaRoute } from '../../routes/media/invoice-media-route';

/** Проверяет выдачу и использование ссылки через настоящий HTTP-сервер. */
describe('Ссылка изображения счёта', () => {
  it('отменяет открытие объекта при отключении клиента', async () => {
    const oldSecret = process.env.MEDIA_RUNTIME_SECRET, oldBase = process.env.MEDIA_PUBLIC_BASE_URL;
    process.env.MEDIA_RUNTIME_SECRET = 'x'.repeat(40); process.env.MEDIA_PUBLIC_BASE_URL = 'https://panel.example';
    const app = express(); app.use(express.json());
    let started!: () => void, aborted!: () => void;
    const opened = new Promise<void>(resolve => { started = resolve; });
    const cancelled = new Promise<void>(resolve => { aborted = resolve; });
    setupInvoiceMediaRoute(app, {
      resolve: async () => ({ media: { id: 4 } }),
      open: async (_object: unknown, signal: AbortSignal) => {
        started();
        await new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => { aborted(); reject(new Error('Отменено')); }, { once: true }));
      },
    } as never);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    try {
      const address = server.address(); if (!address || typeof address === 'string') throw new Error();
      const req = request({ host: '127.0.0.1', port: address.port, path: '/api/runtime/media/invoice-link?projectId=7', method: 'POST', headers: { authorization: `Bearer ${createMediaRuntimeToken(7)}`, 'content-type': 'application/json' } });
      req.on('error', () => undefined);
      req.end(JSON.stringify({ url: '/uploads/7/a.jpg' }));
      await opened; req.destroy();
      await cancelled;
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      if (oldSecret === undefined) delete process.env.MEDIA_RUNTIME_SECRET; else process.env.MEDIA_RUNTIME_SECRET = oldSecret;
      if (oldBase === undefined) delete process.env.MEDIA_PUBLIC_BASE_URL; else process.env.MEDIA_PUBLIC_BASE_URL = oldBase;
    }
  });
  it('ограничивает файл, проект и срок, не раскрывая токен проекта', async () => {
    const oldSecret = process.env.MEDIA_RUNTIME_SECRET, oldBase = process.env.MEDIA_PUBLIC_BASE_URL;
    process.env.MEDIA_RUNTIME_SECRET = 'x'.repeat(40); process.env.MEDIA_PUBLIC_BASE_URL = 'https://panel.example';
    const app = express(); app.use(express.json());
    const media = { id: 4, projectId: 7, url: '/uploads/7/a.jpg' };
    const deps = {
      getFile: async (id: number) => id === 4 ? media : undefined,
      resolve: async (project: number, url: string) => { if (project !== 7 || url !== media.url) throw new Error(); return { media }; },
      open: async () => ({ size: 3, mime: 'image/jpeg', version: 'v', stream: async () => Readable.from(Buffer.from('abc')) }),
    };
    setupInvoiceMediaRoute(app, deps as never);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    try {
      const address = server.address(); if (!address || typeof address === 'string') throw new Error();
      const origin = `http://127.0.0.1:${address.port}`;
      const token = createMediaRuntimeToken(7);
      const issued = await fetch(`${origin}/api/runtime/media/invoice-link?projectId=7`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ url: media.url }) });
      expect(issued.status).toBe(200);
      const data = await issued.json() as { url: string; expiresAt: number };
      expect(data.url).not.toContain(token);
      const path = new URL(data.url).pathname + new URL(data.url).search;
      const got = await fetch(origin + path); expect(got.status).toBe(200); expect(await got.text()).toBe('abc');
      expect((await fetch(origin + path.replace('/7/4', '/8/4'))).status).toBe(403);
      expect((await fetch(origin + path.replace('/7/4', '/7/5'))).status).toBe(403);
      expect((await fetch(origin + path.replace(String(data.expiresAt), '1'))).status).toBe(403);
      expect((await fetch(`${origin}/api/runtime/media/invoice-link?projectId=8`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ url: media.url }) })).status).toBe(401);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      if (oldSecret === undefined) delete process.env.MEDIA_RUNTIME_SECRET; else process.env.MEDIA_RUNTIME_SECRET = oldSecret;
      if (oldBase === undefined) delete process.env.MEDIA_PUBLIC_BASE_URL; else process.env.MEDIA_PUBLIC_BASE_URL = oldBase;
    }
  });
});
