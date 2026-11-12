/** @fileoverview Проверки CSRF на настоящем HTTP: формы, CLI, Mini App, admin и машинные интеграции. */
import express from 'express';
import type { Server } from 'node:http';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { cookieCsrf } from './cookie-csrf';
import { createAdminToken } from '../admin/admin-session';

/** HTTP-сервер изолированных маршрутов без базы данных. */
let server: Server;
/** Локальный адрес тестового сервера. */
let base: string;
/** Количество реально выполненных изменяющих обработчиков. */
let writes = 0;
/** Исходный ключ администратора для восстановления окружения. */
const previousKey = process.env.ADMIN_API_KEY;

beforeAll(async () => {
  process.env.ADMIN_API_KEY = 'csrf-test-admin-key';
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json(), express.urlencoded({ extended: false }));
  app.use((req, _res, next) => {
    if (req.get('Cookie')?.includes('test_session=valid')) {
      Object.assign(req, { session: { telegramUser: { id: 42 } } });
    }
    next();
  });
  app.use(['/api', '/admin/api'], cookieCsrf);
  app.use((_req, res) => { writes++; res.json({ ok: true }); });
  server = await new Promise<Server>((resolve) => { const started = app.listen(0, '127.0.0.1', () => resolve(started)); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Нет адреса HTTP-сервера');
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (previousKey === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = previousKey;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

/**
 * Отправляет cookie-запрос, моделируя исходную форму добавления токена.
 * @param headers - Дополнительные заголовки, переопределяющие значения формы
 * @param path - Проверяемый API-маршрут
 * @returns Ответ настоящего HTTP-сервера
 */
function post(headers: Record<string, string> = {}, path = '/api/projects/12/tokens') {
  return fetch(base + path, { method: 'POST', headers: {
    Cookie: 'test_session=valid', 'Content-Type': 'application/x-www-form-urlencoded', ...headers,
  }, body: headers['Content-Type'] === 'application/json' ? '{"name":"x"}' : 'name=x&token=x&botUsername=x' });
}

it('блокирует чужую обычную форму до выполнения записи, даже с Bearer и специальным заголовком', async () => {
  const before = writes;
  const response = await post({ Origin: 'https://evil.example', Authorization: 'Bearer arbitrary', 'X-Botcraft-CSRF': '1' });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: 'CSRF_ORIGIN_MISMATCH' });
  expect(writes).toBe(before);
});

it('блокирует multipart, null Origin, подменённый forwarded-host и ложный Referer', async () => {
  const cases: Record<string, string>[] = [
    { Origin: 'https://evil.example', 'Content-Type': 'multipart/form-data; boundary=test' },
    { Origin: 'null' }, { Origin: 'https://evil.example', 'X-Forwarded-Host': 'evil.example' },
    { Referer: 'https://evil.example/page' },
  ];
  for (const headers of cases) expect((await post(headers)).status).toBe(403);
});

it('разрешает обычные формы и multipart панели с совпадающим Origin', async () => {
  expect((await post({ Origin: base })).status).toBe(200);
  expect((await post({ Origin: base, 'Content-Type': 'multipart/form-data; boundary=test' })).status).toBe(200);
});

it('не считает другой протокол, порт или путь доверенным Origin', async () => {
  for (const Origin of [base.replace('http:', 'https:'), base + '/path', 'http://127.0.0.1:1']) {
    expect((await post({ Origin })).status).toBe(403);
  }
});

it('разрешает same-origin Referer, но не использует его для отмены плохого Origin', async () => {
  expect((await post({ Referer: base + '/projects/12' })).status).toBe(200);
  expect((await post({ Origin: 'null', Referer: base + '/' })).status).toBe(403);
});

it('поддерживает HTTPS split и Mini App с Origin панели внутри Telegram', async () => {
  expect((await post({ Origin: base.replace('http:', 'https:'), 'X-Forwarded-Proto': 'https',
    'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'empty' })).status).toBe(200);
  expect((await post({ Origin: 'https://web.telegram.org', 'X-Forwarded-Proto': 'https' })).status).toBe(403);
});

it('сохраняет JSON CLI с cookie без Origin, но требует явный заголовок для формы CLI', async () => {
  expect((await post({ 'Content-Type': 'application/json' })).status).toBe(200);
  expect((await post()).status).toBe(403);
  expect((await post({ 'X-Botcraft-CSRF': '1' })).status).toBe(200);
  expect((await post({ 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' })).status).toBe(403);
  expect((await post({ 'X-Botcraft-CSRF': '1', 'Sec-Fetch-Site': 'cross-site' })).status).toBe(403);
});

it('не меняет Bearer-клиенты без сессии и безопасные методы', async () => {
  expect((await post({ Cookie: '', Authorization: 'Bearer agent-token' })).status).toBe(200);
  expect((await fetch(base + '/api/projects', { headers: { Cookie: 'test_session=valid', Origin: 'https://evil.example' } })).status).toBe(200);
});

it('защищает действующую admin-cookie в admin API и общем API', async () => {
  const Cookie = `admin_auth=${createAdminToken('csrf-test-admin-key')}`;
  expect((await post({ Cookie, Origin: 'https://evil.example' }, '/admin/api/logout')).status).toBe(403);
  expect((await post({ Cookie, Origin: 'https://evil.example' })).status).toBe(403);
  expect((await post({ Cookie, Origin: base }, '/admin/api/logout')).status).toBe(200);
  for (const path of ['/api/unknown', '/admin/api/unknown']) {
    expect((await post({ Cookie, Origin: 'https://evil.example' }, path)).status).toBe(403);
    expect((await post({ Cookie, Origin: base }, path)).status).toBe(200);
  }
});

it('оставляет машинные маршруты их собственной авторизации, не освобождая весь auth', async () => {
  for (const path of ['/api/webhook/12/9', '/api/hooks/12/pay', '/api/auth/agent/telegram',
    '/api/auth/agent/disconnect', '/api/runtime/media/incoming-photo', '/api/runtime/media/invoice-link']) {
    expect((await post({ Origin: 'https://external.example' }, path)).status).toBe(200);
  }
  expect((await post({ Origin: 'https://external.example' }, '/api/auth/logout')).status).toBe(403);
  expect((await post({ Origin: 'https://external.example' }, '/api/auth/agent/telegram/unlisted')).status).toBe(403);
  expect((await post({ Origin: 'https://external.example' }, '/api/runtime/media/unlisted')).status).toBe(403);
});
