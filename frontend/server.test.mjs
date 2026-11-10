/** @fileoverview Проверки потокового frontend-прокси и безопасной раздачи SPA. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createFrontendServer } from './server.mjs';
/** Запускает сервер на свободном локальном порту. */
async function listen(server) { await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}`; }
/** Закрывает все соединения тестового сервера. */
async function close(server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
test('SPA, streaming proxy, cookies, private files and unavailable backend', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'botcraft-frontend-'));
  await writeFile(path.join(root, 'index.html'), '<h1>Client</h1>');
  await mkdir(path.join(root, 'server')); await writeFile(path.join(root, 'server/index.js'), 'secret');
  const backend = http.createServer((req, res) => {
    if (req.url === '/api/partial') { res.writeHead(200, { 'Content-Length': '100' }); res.write('partial'); setTimeout(() => res.destroy(), 10); return; }
    if (req.url === '/admin') { res.writeHead(204, { 'X-Botcraft-Client-Page': '1', 'Set-Cookie': 'admin=test; HttpOnly' }).end(); return; }
    if (req.url === '/api/redirect') { res.writeHead(302, { Location: '/auth/login', 'Set-Cookie': ['a=1', 'b=2'] }).end(); return; }
    res.setHeader('Content-Type', 'application/json');
    let size = 0; req.on('data', (chunk) => { size += chunk.length; });
    req.on('end', () => res.end(JSON.stringify({ size, host: req.headers.host, cookie: req.headers.cookie, url: req.url })));
  });
  const backendUrl = await listen(backend);
  const frontend = createFrontendServer({ backendUrl, distPath: root }); const url = await listen(frontend);
  try {
    assert.match(await (await fetch(url + '/projects/12', { headers: { Accept: 'text/html' } })).text(), /Client/);
    assert.equal((await fetch(url + '/missing.js', { headers: { Accept: 'text/html' } })).status, 404);
    assert.equal((await fetch(url + '/server/index.js')).status, 404);
    const upload = await fetch(url + '/api/upload?q=1', { method: 'POST', body: Buffer.alloc(1024 * 1024), headers: { Cookie: 'session=ok' } });
    const result = await upload.json(); assert.equal(result.size, 1024 * 1024); assert.equal(result.host, new URL(url).host); assert.equal(result.cookie, 'session=ok'); assert.equal(result.url, '/api/upload?q=1');
    const admin = await fetch(url + '/admin', { headers: { Accept: 'text/html' } }); assert.match(await admin.text(), /Client/); assert.match(admin.headers.get('set-cookie'), /admin=test/);
    const redirect = await fetch(url + '/api/redirect', { redirect: 'manual' }); assert.equal(redirect.status, 302); assert.equal(redirect.headers.get('location'), '/auth/login'); assert.equal(redirect.headers.getSetCookie().length, 2);
    const asset = await fetch(url + '/assets/legacy.png'); assert.equal((await asset.json()).url, '/assets/legacy.png');
    await assert.rejects(async () => { await (await fetch(url + '/api/partial')).text(); });
    assert.equal((await fetch(url + '/api/alive')).status, 200);
    await close(backend); assert.equal((await fetch(url + '/api/health')).status, 502);
  } finally { await close(frontend); if (backend.listening) await close(backend); await rm(root, { recursive: true }); }
});
test('rejects backend credentials and paths', () => {
  for (const backendUrl of ['file:///tmp', 'http://user:secret@localhost', 'http://localhost/api']) assert.throws(() => createFrontendServer({ backendUrl, distPath: '.' }));
});
