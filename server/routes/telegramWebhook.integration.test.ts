/** @fileoverview Сквозная HTTP-проверка доставки API → исполнитель → обработчик Python. */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { test } from 'node:test';
import express from 'express';
import { handleRunnerWebhook } from '../runner/runnerWebhookServer';
import { createTelegramWebhookHandler } from './telegramWebhookHandler';
import { deliverTelegramWebhook } from './telegramWebhookDelivery';

/** Запускает тестовый сервер на свободном локальном порту. */
async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}`;
}

/** Закрывает соединения, чтобы тест не оставлял фоновые HTTP-сервера. */
async function close(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('API подтверждает только доставленное обновление и сохраняет секрет во всей цепочке', async () => {
  const originalUrl = process.env.RUNNER_WEBHOOK_URL;
  const originalSecret = process.env.RUNNER_WEBHOOK_SECRET;
  const received: Array<{ body: string; secret: string | undefined }> = [];
  let pythonStatus = 200;
  let running = true;
  let processMode = false;
  let queueUnavailable = false;
  const persisted: unknown[] = [];
  const python = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    received.push({ body: Buffer.concat(chunks).toString(), secret: req.headers['x-telegram-bot-api-secret-token'] as string });
    res.writeHead(pythonStatus).end();
  });
  const pythonUrl = await listen(python);
  const runner = createServer((req, res) => {
    void handleRunnerWebhook(req, res, {
      secret: 'transport-secret', isRunning: (project, token) => running && project === 12 && token === 58,
      enqueueWebhook: async (project, token, update, secret) => {
        if (!processMode) return false;
        assert.equal(project, 12);
        assert.equal(token, 58);
        assert.equal(secret, 'telegram-secret');
        if (queueUnavailable) throw new Error('Redis недоступен');
        persisted.push(update);
        return true;
      },
      deliver: async (url, init) => {
        assert.equal(url, 'http://127.0.0.1:9058/webhook');
        assert.equal((init?.headers as Record<string, string>).Authorization, undefined);
        return fetch(`${pythonUrl}/webhook`, init);
      },
    });
  });
  process.env.RUNNER_WEBHOOK_URL = await listen(runner);
  process.env.RUNNER_WEBHOOK_SECRET = 'transport-secret';
  const app = express();
  app.use(express.json());
  app.post('/api/webhook/:projectId/:tokenId', createTelegramWebhookHandler({
    getRecipient: async () => ({ projectId: 12, launchMode: 'webhook', webhookSecretToken: 'telegram-secret' }),
    deliver: (projectId, tokenId, body, secret) => deliverTelegramWebhook({ projectId, tokenId, body, secret, remote: true }),
  }));
  const api = createServer(app);
  const apiUrl = await listen(api);
  /** Отправляет фиктивное обновление без обращения к Telegram. */
  const send = (path = '12/58', secret = 'telegram-secret') => fetch(`${apiUrl}/api/webhook/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': secret },
    body: '{"update_id":123}',
  });
  try {
    assert.equal((await send()).status, 200);
    assert.deepEqual(received, [{ body: '{"update_id":123}', secret: 'telegram-secret' }]);
    assert.equal((await send('99/58')).status, 404);
    assert.equal((await send('12/58', 'wrong')).status, 403);
    assert.equal(received.length, 1);
    pythonStatus = 500;
    assert.equal((await send()).status, 503);
    running = false;
    assert.equal((await send()).status, 503);
    assert.equal(received.length, 2);
    assert.equal((await send('12/90000')).status, 400);
    running = true;
    processMode = true;
    assert.equal((await send()).status, 200);
    assert.deepEqual(persisted, [{ update_id: 123 }]);
    assert.equal(received.length, 2);
    queueUnavailable = true;
    assert.equal((await send()).status, 503);
    assert.equal(persisted.length, 1);
    assert.equal(received.length, 2);
  } finally {
    if (originalUrl === undefined) delete process.env.RUNNER_WEBHOOK_URL; else process.env.RUNNER_WEBHOOK_URL = originalUrl;
    if (originalSecret === undefined) delete process.env.RUNNER_WEBHOOK_SECRET; else process.env.RUNNER_WEBHOOK_SECRET = originalSecret;
    await Promise.all([close(api), close(runner), close(python)]);
  }
});
