/**
 * @fileoverview Локальные HTTP-проверки действующего прокси вебхука без Telegram, БД и настоящих токенов.
 * Запуск: node --import tsx --test scripts/local-webhook/delivery.test.mjs
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import express from 'express';
import { setupWebhookRoutes } from '../../server/routes/setupWebhookRoutes.ts';

/** Запускает временный HTTP-сервер только на локальной машине. */
async function listen(server, host = '127.0.0.1') {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolve);
  });
  return server.address().port;
}

/** Закрывает сервер и оставшиеся соединения после отдельного опыта. */
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

/** Поднимает настоящий Express-маршрут проекта с минимальным JSON-парсером. */
async function startApi() {
  const app = express();
  app.use(express.json());
  setupWebhookRoutes(app);
  const server = http.createServer(app);
  const port = await listen(server);
  return { server, base: `http://127.0.0.1:${port}` };
}

/** Отправляет искусственный апдейт в настоящий маршрут API. */
async function send(api, tokenId, projectId = '123') {
  return fetch(`${api.base}/api/webhook/${projectId}/${tokenId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'invalid-local-secret' },
    body: JSON.stringify({ update_id: 987654, message: { text: 'локальная проверка' } }),
    signal: AbortSignal.timeout(5000),
  });
}

test('Совмещённая сеть: API действительно доставляет тело на локальный порт Python', async () => {
  let received;
  const upstream = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received = { path: req.url, body: JSON.parse(body), secret: req.headers['x-telegram-bot-api-secret-token'] };
    res.writeHead(204).end();
  });
  const upstreamPort = await listen(upstream);
  assert.ok(upstreamPort > 9000, 'Для формулы порта требуется временный порт выше 9000');
  const api = await startApi();
  try {
    const response = await send(api, upstreamPort - 9000);
    assert.equal(response.status, 204);
    assert.equal(received.path, '/webhook');
    assert.equal(received.body.update_id, 987654);
    assert.equal(received.secret, undefined, 'Секрет не передаётся локальному обработчику');
    const otherProject = await send(api, upstreamPort - 9000, '999999');
    assert.equal(otherProject.status, 204, 'Произвольный проект и неправильный секрет не отклоняются');
  } finally {
    await close(api.server);
    await close(upstream);
  }
});

test('Недоступный локальный Python: API подтверждает недоставленный апдейт ответом 200', async () => {
  const placeholder = http.createServer();
  const freePort = await listen(placeholder);
  await close(placeholder);
  const api = await startApi();
  try {
    const response = await send(api, freePort - 9000);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
  } finally {
    await close(api.server);
  }
});

test('Доступный Python с ошибкой 503: API сохраняет код отказа upstream', async () => {
  const upstream = http.createServer((_req, res) => res.writeHead(503).end());
  const upstreamPort = await listen(upstream);
  const api = await startApi();
  try {
    assert.equal((await send(api, upstreamPort - 9000)).status, 503);
  } finally {
    await close(api.server);
    await close(upstream);
  }
});

test('Разные локальные адреса: существующий Python вне localhost не получает апдейт', async () => {
  let delivered = 0;
  const upstream = http.createServer((_req, res) => {
    delivered += 1;
    res.writeHead(204).end();
  });
  const upstreamPort = await listen(upstream, '127.0.0.2');
  const api = await startApi();
  try {
    const response = await send(api, upstreamPort - 9000);
    assert.equal(response.status, 200);
    assert.equal(delivered, 0, 'Прокси ищет только localhost, хотя другой адрес доступен');
    const direct = await fetch(`http://127.0.0.2:${upstreamPort}/webhook`, {
      method: 'POST', signal: AbortSignal.timeout(5000),
    });
    assert.equal(direct.status, 204);
    assert.equal(delivered, 1, 'Прямой контроль доказывает доступность второго адреса');
  } finally {
    await close(api.server);
    await close(upstream);
  }
});
