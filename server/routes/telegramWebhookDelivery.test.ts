/** @fileoverview Проверки адреса закрытого транспорта и передачи заголовков Telegram. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deliverTelegramWebhook, webhookDeliveryTarget } from './telegramWebhookDelivery';

/** Параметры тестового обновления без реальных секретов. */
const input = { projectId: 12, tokenId: 58, body: '{"update_id":1}', secret: 'test-secret', remote: true };

test('локальный режим не зависит от удалённого адреса', () => {
  assert.deepEqual(webhookDeliveryTarget({ ...input, remote: false }), { url: 'http://127.0.0.1:9058/webhook' });
});
test('удалённая доставка передаёт секрет и запрещает перенаправления', async () => {
  const originalUrl = process.env.RUNNER_WEBHOOK_URL;
  const originalSecret = process.env.RUNNER_WEBHOOK_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.RUNNER_WEBHOOK_URL = 'http://bot-runtime.railway.internal:9080';
  process.env.RUNNER_WEBHOOK_SECRET = 'transport-secret';
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'http://bot-runtime.railway.internal:9080/internal/webhook/12/58');
      assert.equal(init?.redirect, 'error');
      assert.deepEqual(init?.headers, { 'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret', Authorization: 'Bearer transport-secret' });
      return new Response(null, { status: 200 });
    };
    assert.equal(await deliverTelegramWebhook(input), 200);
    for (const url of ['file:///tmp/update', 'http://user:pass@runtime', 'http://runtime/path', 'http://runtime?token=x']) {
      process.env.RUNNER_WEBHOOK_URL = url;
      assert.throws(() => webhookDeliveryTarget(input));
    }
    delete process.env.RUNNER_WEBHOOK_SECRET;
    assert.throws(() => webhookDeliveryTarget(input));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.RUNNER_WEBHOOK_URL; else process.env.RUNNER_WEBHOOK_URL = originalUrl;
    if (originalSecret === undefined) delete process.env.RUNNER_WEBHOOK_SECRET; else process.env.RUNNER_WEBHOOK_SECRET = originalSecret;
  }
});
