/** @fileoverview Проверки адресата, секрета и повторяемой доставки Telegram webhook. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Request, Response } from 'express';
import { createTelegramWebhookHandler } from './telegramWebhookHandler';

/** Параметры моделирования входящего webhook. */
interface TestOptions {
  /** Значение проекта в адресе. */
  project?: string;
  /** Значение токена в адресе. */
  token?: string;
  /** Входящий секрет Telegram. */
  secret?: string;
  /** Способ запуска из настроек. */
  mode?: string;
  /** Проект фактического владельца токена. */
  owner?: number;
  /** Моделирует сетевой сбой. */
  failure?: boolean;
  /** Код ответа исполнителя. */
  status?: number;
  /** Моделирует отсутствующий токен. */
  missing?: boolean;
}

/** Выполняет запрос без HTTP-сервера и записывает код ответа. */
async function request(options: TestOptions = {}) {
  let status = 0;
  const deliveries: unknown[][] = [];
  const handler = createTelegramWebhookHandler({
    getRecipient: async () => options.missing ? undefined : ({ projectId: options.owner ?? 12,
      launchMode: options.mode ?? 'webhook', webhookSecretToken: 'test-secret' }),
    deliver: async (...args) => { deliveries.push(args); if (options.failure) throw new Error('offline'); return options.status ?? 200; },
  });
  const req = { params: { projectId: options.project ?? '12', tokenId: options.token ?? '58' },
    body: { update_id: 123 }, get: () => options.secret ?? 'test-secret' } as unknown as Request;
  const res = { status: (value: number) => { status = value; return res; }, end: () => res } as unknown as Response;
  await handler(req, res);
  return { status, deliveries };
}

test('пересылает обновление и исходный заголовок секретного токена', async () => {
  assert.deepEqual(await request(), { status: 200, deliveries: [[12, 58, '{"update_id":123}', 'test-secret']] });
});
test('отклоняет неверный проект и polling без отправки исполнителю', async () => {
  for (const options of [{ owner: 9 }, { mode: 'polling' }, { missing: true }]) {
    assert.deepEqual(await request(options), { status: 404, deliveries: [] });
  }
});
test('отклоняет неверный или отсутствующий секрет', async () => {
  for (const secret of ['', 'wrong-secret', 'other']) {
    assert.deepEqual(await request({ secret }), { status: 403, deliveries: [] });
  }
});
test('строго проверяет идентификаторы и диапазон портов', async () => {
  for (const token of ['58foo', '-1', '0', '56536', '9007199254740993']) {
    assert.deepEqual(await request({ token }), { status: 400, deliveries: [] });
  }
});
test('сбой или непринятое обновление получает 503 вместо ложного подтверждения', async () => {
  assert.equal((await request({ failure: true })).status, 503);
  for (const status of [302, 404, 500, 503]) assert.equal((await request({ status })).status, 503);
  assert.equal((await request({ status: 403 })).status, 403);
});
