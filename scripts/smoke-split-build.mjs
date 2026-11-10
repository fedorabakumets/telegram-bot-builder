/** @fileoverview Проверка двух production-режимов на новой локальной БД без запуска ботов. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { Client } from 'pg';
import WebSocket from 'ws';

/** Метка гарантирует уникальность базы и загружаемых файлов. */
const marker = `split_smoke_${process.pid}_${Date.now()}`;
/** Источник реквизитов разрешён только для локальной PostgreSQL. */
const source = new URL(process.env.LOCAL_DATABASE_TEST_URL || process.env.DATABASE_URL || 'postgres://localhost/postgres');
assert(['localhost', '127.0.0.1', '[::1]'].includes(source.hostname), 'Разрешена только локальная PostgreSQL');
/** Созданные процессы и файлы принадлежат исключительно этой проверке. */
const children = [], uploads = new Set();
/** Диагностика ограничена последними строками без публикации переменных окружения. */
let output = '', created = false;
/** Интервал используется только между проверками готовности. */
const delay = ms => new Promise(done => setTimeout(done, ms));

/** Выделяет свободный локальный порт для дочернего процесса. */
async function freePort() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

/** Выполняет административный SQL только на предварительно проверенном локальном сервере. */
async function administrative(sql) {
  const client = new Client({ connectionString: source.toString() });
  try { await client.connect(); await client.query(sql); }
  finally { await client.end(); }
}

/** Создаёт безопасное окружение: новая БД, отключённые боты, Redis и внешние хранилища. */
function environment(port) {
  const database = new URL(source); database.pathname = `/${marker}`;
  const env = { ...process.env, NODE_ENV: 'production', PORT: String(port), FRONTEND_PORT: String(port), HOST: '127.0.0.1', DATABASE_URL: database.toString(),
    SESSION_SECRET: randomBytes(32).toString('hex'), ADMIN_API_KEY: 'isolated-smoke-admin-key',
    REDIS_URL: '', SKIP_AUTH: 'true', COOKIE_SECURE: 'false', PGSSLMODE: 'disable', BOT_RUNTIME_ENABLED: 'false',
    BOT_DATABASE_URL: '', DB_BACKUP_INTERVAL_HOURS: '0', DB_BACKUP_TARGETS: '', STORAGE_BACKEND: 'local',
    UPLOADS_STORAGE_ID: '', TELEGRAM_PROXY_URL: '', HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '' };
  for (const key of Object.keys(env)) {
    if (/^(S3_|AWS_|RAILWAY_|OPENROUTER_|OPENAI_)/.test(key) || /TOKEN|SESSION_STRING|WEBHOOK/.test(key)) env[key] = '';
  }
  return env;
}

/** Запускает только нужный собранный файл и ожидает HTTP-готовность. */
async function launch(entry, env, health = '/api/health') {
  const child = spawn(process.execPath, [entry], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  children.push(child);
  child.on('error', error => { output += error.message; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk).slice(-18000); });
  const base = `http://127.0.0.1:${entry === 'scripts/dev-split.mjs' ? env.FRONTEND_PORT : env.PORT}`;
  for (let i = 0; i < 240; i++) {
    assert.equal(child.exitCode, null, `Процесс ${entry} завершился`);
    try { if ((await fetch(base + health, { signal: AbortSignal.timeout(1000) })).ok) return { child, base }; }
    catch { /* Первый запуск выполняет миграции новой БД. */ }
    await delay(500);
  }
  throw new Error(`Не дождались готовности ${entry}`);
}

/** Останавливает только дочерний процесс проверки, включая случай зависшего shutdown. */
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (child.spawnargs.includes('scripts/dev-split.mjs') && child.connected) child.send({ type: 'shutdown' });
  else child.kill('SIGTERM');
  await Promise.race([once(child, 'exit'), delay(8000)]);
  if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await once(child, 'exit'); }
}

/** Подтверждает обмен сообщениями через настоящий canvas WebSocket с сессионной cookie. */
async function websocket(base, cookie, projectId) {
  const ws = new WebSocket(`${base.replace('http:', 'ws:')}/api/canvas?projectId=${projectId}`, { headers: { cookie } });
  let timeout;
  const deadline = new Promise((_, reject) => { timeout = setTimeout(() => { ws.terminate(); reject(new Error('Нет ответа canvas WebSocket')); }, 10000); });
  try {
    await Promise.race([once(ws, 'open'), deadline]);
    // Обработчик сессии подключается асинхронно после upgrade; повторный ping устраняет гонку.
    const ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' })); }, 100);
    try { const [data] = await Promise.race([once(ws, 'message'), deadline]); assert.equal(JSON.parse(data.toString()).type, 'pong'); }
    finally { clearInterval(ping); }
  } finally { clearTimeout(timeout); ws.close(); }
}

/** Проверяет реальные пользовательские и административные запросы через единый публичный адрес. */
async function exercise(base, mode) {
  const cookies = new Map();
  /** Сохраняет несколько независимых cookie и запрещает автоматическое следование редиректам. */
  async function request(path, options = {}, status = 200) {
    const response = await fetch(base + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(30000),
      headers: { cookie: [...cookies.values()].filter(item => path.startsWith(item.path)).map(item => item.pair).join('; '), ...options.headers } });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0], name = pair.slice(0, pair.indexOf('='));
      const cookiePath = value.match(/;\s*Path=([^;]+)/i)?.[1] || '/';
      const key = `${cookiePath}|${name}`;
      if (/;\s*Max-Age=0(?:;|$)/i.test(value)) cookies.delete(key);
      else cookies.set(key, { pair, path: cookiePath });
    }
    assert.equal(response.status, status, `${mode} ${path}: ${response.status}`);
    return response;
  }
  const html = await (await request('/projects/123?tab=dialogs', { headers: { Accept: 'text/html' } })).text();
  const asset = html.match(mode === 'dev-split' ? /src="([^" ]*\/@vite\/client)"/ : /(?:src|href)="(\/assets\/[^" ]+)"/);
  assert(asset, 'Прямая ссылка не вернула интерфейс'); await request(asset[1]);
  await request('/api/health', { method: 'HEAD' });
  if (mode !== 'dev-split') {
    for (const path of ['/server/index.js', '/server/index.js.map', '/server%2Findex.js', '/assets/%2e%2e/server/index.js']) await request(path, {}, 404);
  }
  await request('/api/auth/dev-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 8000000000000 + process.pid, firstName: marker, username: 'split_smoke' }) });
  const me = await (await request('/api/auth/me')).json(); assert(me.user?.id, 'Cookie сессии не сохранилась');
  const missing = await request('/api/split-smoke-missing', {}, 404); assert.match(missing.headers.get('content-type'), /json/);
  const project = await (await request('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${marker}_${mode}`, data: { nodes: [], connections: [] }, userDatabaseEnabled: 0 }) }, 201)).json();
  await websocket(base, [...cookies.values()].filter(item => '/api/canvas'.startsWith(item.path)).map(item => item.pair).join('; '), project.id);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ioAAAAASUVORK5CYII=', 'base64');
  const form = new FormData(); form.set('file', new Blob([png], { type: 'image/png' }), `${marker}_${mode}.png`);
  const media = await (await request(`/api/media/upload/${project.id}`, { method: 'POST', body: form })).json();
  assert(media.url?.startsWith('/uploads/'));
  const path = resolve(media.url.slice(1)), inside = relative(resolve('uploads'), path);
  assert(!inside.startsWith('..') && !isAbsolute(inside) && path.includes(marker)); uploads.add(path);
  assert.deepEqual(Buffer.from(await (await request(media.url)).arrayBuffer()), png);
  assert.match(await (await request('/admin/login')).text(), /<form/);
  assert.equal((await (await request('/admin/api/status')).json()).authenticated, false);
  await request('/admin/api/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'key=isolated-smoke-admin-key' }, 302);
  assert.equal((await (await request('/admin/api/status')).json()).authenticated, true);
  await request('/admin/settings', { headers: { Accept: 'text/html' } });
  console.log(`${mode}: интерфейс, ресурсы, сессия, API, WebSocket, медиа и admin — OK`);
}

try {
  await administrative(`CREATE DATABASE "${marker}"`); created = true;
  if (process.argv.includes('--dev')) {
    const env = { ...environment(await freePort()), NODE_ENV: 'development', BACKEND_PORT: String(await freePort()) };
    const dev = await launch('scripts/dev-split.mjs', env);
    await exercise(dev.base, 'dev-split');
  } else {
  const combined = await launch('dist/server/index.js', { ...environment(await freePort()), APP_MODE: 'combined' });
  await exercise(combined.base, 'combined'); await stop(combined.child);
  const backendEnv = { ...environment(await freePort()), APP_MODE: 'backend' };
  const backend = await launch('dist/server/index.js', backendEnv);
  assert.equal((await fetch(backend.base + '/projects/123')).status, 404, 'Backend не должен раздавать SPA');
  const frontend = await launch('frontend/index.mjs', { ...environment(await freePort()), BACKEND_URL: backend.base });
  await exercise(frontend.base, 'split');
  }
  assert(!/Start polling|Running bot/.test(output), 'Неожиданный запуск реального бота');
} catch (error) {
  process.exitCode = 1;
  console.error(error);
  console.error(output.replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[скрытый адрес БД]').replace(/\b\d{6,}:[A-Za-z0-9_-]+/g, '[скрытый токен]'));
} finally {
  for (const child of children.reverse()) await stop(child);
  for (const path of uploads) await unlink(path).catch(() => {});
  if (created) await administrative(`DROP DATABASE "${marker}" WITH (FORCE)`);
}

