/** @fileoverview Проверка выдачи медиа без клиентского dist и доступа к серверному бандлу. */
import express from 'express';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('../routes/media/registered-uploads-fallback', () => ({
  createRegisteredUploadsFallback: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
import { serveBackendMedia } from '../routes/viteDev/middleware/backendMediaMiddleware';

it('выдаёт локальные и исторические медиа, но не SPA или dist/server', async () => {
  const root = await mkdtemp(join(tmpdir(), 'botcraft-backend-media-'));
  vi.stubEnv('BOTCRAFT_APP_ROOT', root);
  await mkdir(join(root, 'uploads'), { recursive: true });
  await mkdir(join(root, 'bots', 'project_12_1', 'uploads'), { recursive: true });
  await mkdir(join(root, 'dist', 'server'), { recursive: true });
  await writeFile(join(root, 'uploads', 'local.txt'), 'local');
  await writeFile(join(root, 'bots', 'project_12_1', 'uploads', 'legacy.txt'), 'legacy');
  await writeFile(join(root, 'dist', 'index.html'), 'SPA');
  await writeFile(join(root, 'dist', 'server', 'index.js'), 'secret');
  const app = express();
  serveBackendMedia(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Нет тестового порта');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    expect(await (await fetch(`${base}/uploads/local.txt`)).text()).toBe('local');
    expect(await (await fetch(`${base}/uploads/12/legacy.txt`)).text()).toBe('legacy');
    expect((await fetch(`${base}/projects/12`)).status).toBe(404);
    expect((await fetch(`${base}/server/index.js`)).status).toBe(404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  }
});
