/**
 * @fileoverview Изолированные характеристики безопасности текущего webhook без БД, Telegram и production.
 * Успех CHARACTERIZATION означает воспроизведение дефекта, а не принятие безопасности.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import test from 'node:test';
import express from 'express';
import { setupWebhookRoutes, getBotWebhookPort } from '../../server/routes/setupWebhookRoutes.ts';
import { requireApiAuth } from '../../server/middleware/requireApiAuth.ts';
import { captureAgentBody } from '../../server/auth/agent/signature.ts';

/** Поднимает только проверяемые middleware и реальный обработчик на случайном loopback-порту. */
async function fixture() {
  const source = await readFile(new URL('../../server/index.ts', import.meta.url), 'utf8');
  const match = source.match(/app\.use\(express\.json\(\{ limit: '([^']+)', verify: captureAgentBody \}\)\)/);
  assert.ok(match, 'Настройки настоящего JSON-парсера изменились: требуется пересмотр probe');
  const app = express();
  app.use(express.json({ limit: match[1], verify: captureAgentBody }));
  app.use('/api', requireApiAuth);
  setupWebhookRoutes(app);
  app.get('/api/private-probe', (_req, res) => res.sendStatus(204));
  /** Возвращает ошибки парсера без штатного шумного стека Express. */
  app.use((error, _req, res, _next) => res.sendStatus(error.status ?? 500));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

/** Отправляет тело через настоящий HTTP, а исходящие запросы обработчика заменяет безопасной заглушкой. */
test('Изолированные характеристики текущего webhook', async (t) => {
  const { server, origin } = await fixture();
  const realFetch = globalThis.fetch;
  const calls = [];
  let upstreamStatus = 200;
  let fail = false;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^http:\/\/localhost:\d+\/webhook$/);
    calls.push({ url, options });
    if (fail) throw new Error('Локально смоделированная недоступность');
    return new Response(null, { status: upstreamStatus });
  };
  /** Выполняет только локальный входящий запрос с заданными параметрами. */
  const post = (path, body = { update_id: 1 }, headers = {}) => realFetch(origin + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  try {
    await t.test('Обычный закрытый API без сессии возвращает 401', async () => {
      assert.equal((await realFetch(origin + '/api/private-probe')).status, 401);
    });
    await t.test('CHARACTERIZATION: webhook без авторизации и секрета достигает Python', async () => {
      const response = await post('/api/webhook/12/7');
      assert.equal(response.status, 200);
      assert.equal(calls.at(-1).url, 'http://localhost:9007/webhook');
    });
    await t.test('CHARACTERIZATION: неправильный секрет не проверяется и не передаётся', async () => {
      assert.equal((await post('/api/webhook/12/7', {}, { 'X-Telegram-Bot-Api-Secret-Token': 'wrong' })).status, 200);
      assert.equal(calls.at(-1).options.headers['X-Telegram-Bot-Api-Secret-Token'], undefined);
    });
    await t.test('CHARACTERIZATION: замена проекта не меняет цель и не проверяет принадлежность', async () => {
      await post('/api/webhook/999999/7');
      assert.equal(calls.at(-1).url, 'http://localhost:9007/webhook');
    });
    await t.test('CHARACTERIZATION: частично числовые и отрицательные ID принимаются', async () => {
      assert.equal((await post('/api/webhook/12junk/7junk')).status, 200);
      assert.equal((await post('/api/webhook/-1/-1')).status, 200);
      assert.equal(calls.at(-1).url, 'http://localhost:8999/webhook');
      assert.equal(getBotWebhookPort(60000), 69000);
    });
    await t.test('Нечисловой ID отклоняется до исходящего запроса', async () => {
      const count = calls.length;
      assert.equal((await post('/api/webhook/nope/7')).status, 400);
      assert.equal(calls.length, count);
    });
    await t.test('CHARACTERIZATION: тело 2 МиБ без схемы обновления принимается', async () => {
      assert.equal((await post('/api/webhook/12/7', { arbitrary: 'x'.repeat(2 * 1024 * 1024) })).status, 200);
      assert.ok(calls.at(-1).options.body.length > 2 * 1024 * 1024);
    });
    await t.test('Фактический глобальный лимит 50mb отклоняет объявленное тело 51 МиБ', async () => {
      const count = calls.length;
      const status = await new Promise((resolve, reject) => {
        const request = http.request(origin + '/api/webhook/12/7', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': 51 * 1024 * 1024 },
        }, (response) => { response.resume(); resolve(response.statusCode); });
        request.on('error', reject);
        request.setTimeout(5000, () => request.destroy(new Error('Истёк локальный срок запроса')));
        request.end(Buffer.alloc(51 * 1024 * 1024, 32));
      });
      assert.equal(status, 413);
      assert.equal(calls.length, count);
    });
    await t.test('Статус ответа Python сохраняется', async () => {
      upstreamStatus = 503;
      assert.equal((await post('/api/webhook/12/7')).status, 503);
    });
    await t.test('CHARACTERIZATION: ошибка транспорта подтверждает недоставленный update кодом 200', async () => {
      fail = true;
      assert.equal((await post('/api/webhook/12/7')).status, 200);
    });
  } finally {
    globalThis.fetch = realFetch;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
