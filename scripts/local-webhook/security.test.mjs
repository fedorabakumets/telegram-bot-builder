/**
 * @fileoverview Изолированные регрессии безопасности webhook без БД, Telegram и production.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import test from 'node:test';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { createTelegramWebhookHandler } from '../../server/routes/telegramWebhookHandler.ts';
import { deliverTelegramWebhook } from '../../server/routes/telegramWebhookDelivery.ts';
import { requireApiAuth } from '../../server/middleware/requireApiAuth.ts';
import { captureAgentBody } from '../../server/auth/agent/signature.ts';

/**
 * Поднимает проверяемые middleware и обработчик на случайном loopback-порту.
 * @param limit - Число запросов в минуту; отдельный малый лимит проверяет защиту от перебора.
 * @returns Локальный сервер и его адрес.
 */
async function fixture(limit = 1000) {
  const source = await readFile(new URL('../../server/index.ts', import.meta.url), 'utf8');
  const match = source.match(/app\.use\(express\.json\(\{ limit: '([^']+)', verify: captureAgentBody \}\)\)/);
  assert.ok(match, 'Настройки настоящего JSON-парсера изменились: требуется пересмотр probe');
  const app = express();
  app.use('/api', rateLimit({ windowMs: 60_000, limit, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(express.json({ limit: match[1], verify: captureAgentBody }));
  app.use('/api', requireApiAuth);
  /** Подставляем только хранилище адресата; настоящие проверка и транспорт остаются под тестом. */
  app.post('/api/webhook/:projectId/:tokenId', createTelegramWebhookHandler({
    getRecipient: async (tokenId) => tokenId === 7
      ? { projectId: 12, launchMode: 'webhook', webhookSecretToken: 'fixture-secret' } : undefined,
    deliver: (projectId, tokenId, body, secret) => deliverTelegramWebhook({
      projectId, tokenId, body, secret, remote: false,
    }),
  }));
  app.get('/api/private-probe', (_req, res) => res.sendStatus(204));
  /** Возвращает ошибки парсера без штатного шумного стека Express. */
  app.use((error, _req, res, _next) => res.sendStatus(error.status ?? 500));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

/** Отправляет тело через настоящий HTTP, а исходящие запросы обработчика заменяет безопасной заглушкой. */
test('Изолированные регрессии безопасности webhook', async (t) => {
  const { server, origin } = await fixture();
  const realFetch = globalThis.fetch;
  const calls = [];
  let upstreamStatus = 200;
  let fail = false;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^http:\/\/127\.0\.0\.1:\d+\/webhook$/);
    calls.push({ url, options });
    if (fail) throw new Error('Локально смоделированная недоступность');
    return new Response(null, { status: upstreamStatus });
  };
  /** Выполняет только локальный входящий запрос с заданными параметрами. */
  const post = (path, body = { update_id: 1 }, headers = {}) => realFetch(origin + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': 'fixture-secret', ...headers }, body: JSON.stringify(body),
  });
  try {
    await t.test('Лимит API срабатывает до авторизации без изменения ответа первого запроса', async () => {
      const limited = await fixture(2);
      try {
        assert.equal((await realFetch(limited.origin + '/api/private-probe')).status, 401);
        assert.equal((await realFetch(limited.origin + '/api/private-probe')).status, 401);
        assert.equal((await realFetch(limited.origin + '/api/private-probe')).status, 429);
      } finally {
        limited.server.closeAllConnections();
        await new Promise((resolve) => limited.server.close(resolve));
      }
    });
    await t.test('Обычный закрытый API без сессии возвращает 401', async () => {
      assert.equal((await realFetch(origin + '/api/private-probe')).status, 401);
    });
    await t.test('Правильный секрет разрешает доставку и передаётся обработчику', async () => {
      assert.equal((await post('/api/webhook/12/7')).status, 200);
      assert.equal(calls.at(-1).url, 'http://127.0.0.1:9007/webhook');
      assert.equal(calls.at(-1).options.headers['X-Telegram-Bot-Api-Secret-Token'], 'fixture-secret');
    });
    await t.test('Отсутствующий и неправильный секрет не достигают обработчика', async () => {
      const count = calls.length;
      for (const value of ['', 'wrong']) {
        assert.equal((await post('/api/webhook/12/7', {}, { 'X-Telegram-Bot-Api-Secret-Token': value })).status, 403);
      }
      assert.equal(calls.length, count);
    });
    await t.test('Подмена проекта и неизвестный бот отклоняются до доставки', async () => {
      const count = calls.length;
      assert.equal((await post('/api/webhook/999999/7')).status, 404);
      assert.equal((await post('/api/webhook/12/8')).status, 404);
      assert.equal(calls.length, count);
    });
    await t.test('Частичные, отрицательные и выходящие за диапазон ID отклоняются', async () => {
      const count = calls.length;
      for (const route of ['/api/webhook/12junk/7junk', '/api/webhook/-1/-1', '/api/webhook/12/60000']) {
        assert.equal((await post(route)).status, 400);
      }
      assert.equal(calls.length, count);
    });
    await t.test('Нечисловой ID отклоняется до исходящего запроса', async () => {
      const count = calls.length;
      assert.equal((await post('/api/webhook/nope/7')).status, 400);
      assert.equal(calls.length, count);
    });
    await t.test('Тело больше лимита webhook не передаётся обработчику', async () => {
      const count = calls.length;
      assert.equal((await post('/api/webhook/12/7', { arbitrary: 'x'.repeat(2 * 1024 * 1024) })).status, 413);
      assert.equal(calls.length, count);
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
    await t.test('Ошибка транспорта возвращает 503 для повторной доставки Telegram', async () => {
      fail = true;
      assert.equal((await post('/api/webhook/12/7')).status, 503);
    });
  } finally {
    globalThis.fetch = realFetch;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
