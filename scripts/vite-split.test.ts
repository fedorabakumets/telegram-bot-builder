/**
 * @fileoverview Проверки маршрутизации отдельного Vite и защищённой передачи админки.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createSplitViteServer } from './vite-split-config';
import { proxyAdminToVite } from './vite-admin-proxy';

/** Открывает локальный HTTP-сервер на свободном порту. */
async function listen(server: http.Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
/** Закрывает сервер вместе с оставшимися keep-alive соединениями. */
async function close(server: http.Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
test('Прокси оставляет внешний Host и не захватывает похожие SPA-маршруты', () => {
  const config = createSplitViteServer({ FRONTEND_PORT: '5180', BACKEND_PORT: '5080' });
  assert.equal(config.port, 5180);
  assert.equal(config.strictPort, true);
  const patterns = Object.keys(config.proxy!);
  for (const path of ['/api/test', '/api/terminal', '/uploads/image', '/admin/login', '/docs-json', '/mcp']) {
    assert.ok(patterns.some((pattern) => new RegExp(pattern).test(path)), path);
  }
  for (const path of ['/projects/12', '/apiary', '/uploads-other', '/assets/main.js']) {
    assert.ok(!patterns.some((pattern) => new RegExp(pattern).test(path)), path);
  }
  assert.throws(() => createSplitViteServer({ BACKEND_URL: 'http://secret:password@localhost' }));
});
test('Админка выполняет проверку один раз и сохраняет redirect/cookie либо пропускает HTML', async () => {
  let calls = 0;
  const backend = http.createServer((req, res) => {
    calls++;
    if (req.url === '/admin/allowed') {
      res.writeHead(204, { 'X-Botcraft-Client-Page': '1', 'Set-Cookie': ['one=1', 'two=2'] });
    } else {
      res.writeHead(302, { Location: '/admin/login', 'Set-Cookie': ['one=1', 'two=2'] });
    }
    res.end();
  });
  const target = await listen(backend);
  const bypass = proxyAdminToVite(target);
  const frontend = http.createServer(async (req, res) => {
    await bypass(req, res);
    if (!res.writableEnded) res.end('protected SPA');
  });
  const url = await listen(frontend);
  try {
    const blocked = await fetch(`${url}/admin/blocked`, { redirect: 'manual' });
    assert.equal(blocked.status, 302);
    assert.equal(blocked.headers.get('location'), '/admin/login');
    assert.equal(blocked.headers.getSetCookie().length, 2);
    const allowed = await fetch(`${url}/admin/allowed`);
    assert.equal(await allowed.text(), 'protected SPA');
    assert.equal(allowed.headers.getSetCookie().length, 2);
    assert.equal(calls, 2);
  } finally { await close(frontend); await close(backend); }
});
