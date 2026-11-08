/** @fileoverview Изолированная проверка собранного сервера без запуска ботов и обращения к продакшену. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { Client } from 'pg';
import { unzipSync, strFromU8 } from 'fflate';

/** Уникальный идентификатор только этой проверки. */
const marker = `compiled-smoke-${process.pid}-${Date.now()}`;
/** Изолированная база, которую разрешено удалить при завершении. */
const database = marker.replaceAll('-', '_');
/** Административное соединение используется только для создания и удаления новой базы. */
const original = new URL(process.env.DATABASE_URL || 'postgres://localhost/postgres');
assert(['localhost', '127.0.0.1', '[::1]'].includes(original.hostname), 'Разрешена только локальная PostgreSQL');
/** Каталог временной компиляции Python; код никогда не исполняется. */
const temporary = await mkdtemp(join(tmpdir(), `${marker}-`));
/** Точный список созданных загрузок; существующие каталоги uploads не удаляются. */
const createdUploads = new Set();
/** Последние строки журнала сервера для диагностики без секретов. */
let output = '';
/** Дочерний процесс только данной проверки. */
let child;
/** Признак успешного создания базы. */
let created = false;
/** Сессионная cookie выделенного тестового пользователя. */
let cookie = '';
/** Адрес HTTP сервера, назначаемый после выбора свободного порта. */
let base;

/** Ожидает заданный интервал между попытками проверки HTTP. */
const delay = milliseconds => new Promise(done => setTimeout(done, milliseconds));

/** Выбирает свободный локальный порт; сервер приложения запускается сразу после освобождения. */
async function freePort() {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(done => socket.close(done));
  return port;
}

/** Отправляет запрос только изолированному серверу, проверяет статус и сохраняет cookie. */
async function request(path, options = {}, expected = 200) {
  const response = await fetch(`${base}${path}`, {
    ...options, headers: { ...(cookie ? { cookie } : {}), ...options.headers },
    signal: AbortSignal.timeout(60_000),
  });
  const setCookie = response.headers.getSetCookie();
  if (setCookie.length) cookie = setCookie.map(value => value.split(';')[0]).join('; ');
  assert.equal(response.status, expected, `${options.method || 'GET'} ${path}: ${response.status}`);
  return response;
}

/** Выполняет JSON-запрос, не передавая никакие реальные токены. */
async function json(path, body, method = 'POST', expected = 200) {
  return (await request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, expected)).json();
}

/** Проверяет синтаксис Python в отдельном каталоге без исполнения сгенерированного бота. */
async function compile(code) {
  const path = join(temporary, 'bot.py');
  await writeFile(path, code);
  const executable = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
  const python = spawn(executable, ['-m', 'py_compile', path], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let errors = '';
  python.stderr.on('data', chunk => { errors += chunk; });
  const [codeResult] = await once(python, 'exit');
  assert.equal(codeResult, 0, `Проверка Python: ${errors}`);
}

/** Проверяет архив и синтаксис находящегося внутри Python. */
async function archive(projectId) {
  const response = await request(`/api/projects/${projectId}/export?format=zip`, { method: 'POST' });
  assert.match(response.headers.get('content-type'), /application\/zip/);
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  assert(files['bot.py'] && files['manifest.json'], 'В архиве нет обязательных файлов');
  await compile(strFromU8(files['bot.py']));
  return files;
}

/** Запускает проверку на пустой БД, не используя текущие проекты и авторизацию. */
async function main() {
  const admin = new Client({ connectionString: original.toString() });
  await admin.connect();
  try { await admin.query(`CREATE DATABASE "${database}"`); created = true; }
  finally { await admin.end(); }
  const fixture = new URL(original);
  fixture.pathname = `/${database}`;
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  const environment = { ...process.env, NODE_ENV: 'production', PORT: String(port), DATABASE_URL: fixture.toString(),
    REDIS_URL: '', SKIP_AUTH: 'true', COOKIE_SECURE: 'false', PGSSLMODE: 'disable', BOT_RUNTIME_ENABLED: 'false',
    BOT_DATABASE_URL: '', DB_BACKUP_INTERVAL_HOURS: '0', DB_BACKUP_TARGETS: '', STORAGE_BACKEND: 'local',
    UPLOADS_STORAGE_ID: '', TELEGRAM_PROXY_URL: '', HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '',
    BOT_TOKEN: '', TELEGRAM_BOT_TOKEN: '', SUPPORT_BOT_TOKEN: '', WEBHOOK_URL: '', TELEGRAM_LOGIN_BOT_TOKEN: '' };
  for (const key of Object.keys(environment)) {
    if (/^(?:S3_|AWS_|RAILWAY_|OPENROUTER_|OPENAI_)/.test(key)) environment[key] = '';
    if (/TOKEN|SESSION_STRING|WEBHOOK/.test(key) && !['SESSION_SECRET'].includes(key)) environment[key] = '';
  }
  child = spawn(process.execPath, ['dist/server/index.js'], { cwd: process.cwd(), env: environment,
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  child.on('error', error => { output += `\n${error.message}`; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk).slice(-12_000); });
  let ready = false;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (child.exitCode !== null) throw new Error(`Сервер завершился: ${child.exitCode}`);
    try { const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) }); ready = response.ok; }
    catch { /* Миграции ещё выполняются. */ }
    if (ready) break;
    await delay(500);
  }
  assert(ready, 'Сервер не стал доступен за две минуты');
  await request('/api/health', { method: 'HEAD' });
  const html = await (await request('/')).text();
  const asset = html.match(/(?:src|href)="([^" ]+\/assets\/[^" ]+|\/assets\/[^" ]+)"/);
  assert(asset, 'В HTML нет собранного ресурса');
  await request(asset[1]);
  for (const path of ['/server/index.js', '/server/index.js.map', '/server%2Findex.js', '/assets/%2e%2e/server/index.js']) {
    const response = await fetch(`${base}${path}`);
    const content = await response.text();
    assert.equal(response.status, 404, `Исходники должны возвращать 404: ${path}`);
    assert(!content.includes('sourceMappingURL='), `Утечка исходников: ${path}`);
  }
  await json('/api/auth/dev-login', { id: 8000000000000 + process.pid, firstName: 'Compiled smoke', username: 'compiled_smoke' });
  const missing = await request('/api/compiled-smoke-nonexistent', {}, 404);
  assert.match(missing.headers.get('content-type'), /json/);
  const data = { nodes: [
    { id: 'start', type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: '/start', description: 'Начать проверку', autoTransitionTo: 'smoke-message' } },
    { id: 'smoke-message', type: 'message', position: { x: 300, y: 0 }, data: { buttons: [], messageText: 'Проверка сборки', keyboardType: 'none', markdown: false } },
  ], connections: [] };
  const project = await json('/api/projects', { name: marker, data, userDatabaseEnabled: 0 }, 'POST', 201);
  assert(project.id, 'Не создан изолированный проект');
  const generated = await json(`/api/projects/${project.id}/generate`, { userDatabaseEnabled: false, enableLogging: false });
  assert.equal(typeof generated.code, 'string');
  assert(generated.code.includes('Проверка сборки'), 'Генератор не включил текст тестовой ноды');
  await compile(generated.code);
  const exported = await json(`/api/projects/${project.id}/export`, {});
  await compile(exported.code);
  await archive(project.id);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ioAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.set('file', new Blob([png], { type: 'image/png' }), `${marker}.png`);
  const media = await (await request(`/api/media/upload/${project.id}`, { method: 'POST', body: form })).json();
  assert(media.url?.startsWith('/uploads/'), 'Нет локального адреса медиа');
  const path = resolve(process.cwd(), media.url.slice(1));
  const inside = relative(resolve(process.cwd(), 'uploads'), path);
  assert(!inside.startsWith('..') && !isAbsolute(inside) && path.includes(marker), 'Небезопасный путь очистки загрузки');
  createdUploads.add(path);
  assert.deepEqual(Buffer.from(await (await request(media.url)).arrayBuffer()), png);
  data.nodes[1].data.attachedMedia = [media.url];
  data.nodes[1].data.imageUrl = media.url;
  await json(`/api/projects/${project.id}`, { data }, 'PUT');
  const files = await archive(project.id);
  assert.deepEqual(Buffer.from(files[media.url.slice(1)] || []), png, 'Оригинал не включён в ZIP');
  assert(!/Start polling|Running bot|поднят \(попыток/.test(output), 'Неожиданный запуск бота');
  console.log('Smoke OK: health, статика, защита исходников, auth, генератор, Python, export, ZIP, загрузка и оригинал медиа.');
}

try { await main(); }
catch (error) {
  console.error(`Smoke FAIL: ${error.message}`);
  console.error(output.replace(/(?:postgres(?:ql)?:\/\/)[^\s"']+/g, '[скрытый адрес БД]').replace(/\b\d{6,}:[A-Za-z0-9_-]+/g, '[скрытый токен]'));
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit').catch(() => {}), delay(8000)]);
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await once(child, 'exit').catch(() => {}); }
  }
  if (created) {
    const admin = new Client({ connectionString: original.toString() });
    try { await admin.connect(); await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`); }
    finally { await admin.end(); }
  }
  for (const path of createdUploads) await unlink(path).catch(() => {});
  await rm(temporary, { recursive: true, force: true });
  console.log(process.platform === 'win32' ? 'Изоляция очищена. Windows: SIGTERM завершает процесс без проверки обработчика сигналов.' : 'Изоляция очищена; дочерний сервер остановлен.');
}
