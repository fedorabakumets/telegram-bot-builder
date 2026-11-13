/** @fileoverview Проверки единого приоритета адреса вебхука при запуске и в публичном конфиге. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveWebhookBaseUrl } from './webhookBaseUrl';

test('индивидуальный адрес важнее адресов API и устаревшей настройки', () => {
  assert.equal(resolveWebhookBaseUrl(' https://bot.example/prefix/// ', {
    API_BASE_URL: 'https://api.example', WEBHOOK_URL: 'https://legacy.example',
  }), 'https://bot.example/prefix');
});

test('пустое индивидуальное значение наследует API_BASE_URL', () => {
  for (const override of [undefined, null, '', '   ']) {
    assert.equal(resolveWebhookBaseUrl(override, {
      API_BASE_URL: ' https://api.example/// ', WEBHOOK_URL: 'https://legacy.example',
    }), 'https://api.example');
  }
});

test('старый адрес применяется только без API_BASE_URL', () => {
  assert.equal(resolveWebhookBaseUrl(null, { API_BASE_URL: ' ', WEBHOOK_URL: 'https://legacy.example/' }),
    'https://legacy.example');
  assert.equal(resolveWebhookBaseUrl(null, {}), null);
});
