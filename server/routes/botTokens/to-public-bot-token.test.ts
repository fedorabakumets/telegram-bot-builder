/** @fileoverview Проверки безопасного признака существования секрета вебхука. */
import assert from 'node:assert/strict';
import test from 'node:test';
import type { BotToken } from '@shared/schema';
import { toPublicBotToken } from './to-public-bot-token';

test('публичный токен сообщает о защите, не раскрывая сохранённый секрет', () => {
  const result = toPublicBotToken({ token: '123:secret', webhookSecretToken: 'private_webhook' } as BotToken);
  assert.equal(result.hasWebhookSecret, true);
  assert.equal(result.webhookSecretToken, null);
  assert.ok(!JSON.stringify(result).includes('private_webhook'));
});

test('устаревший признак не подменяет реальное отсутствие секрета', () => {
  const result = toPublicBotToken({ token: '123:secret', webhookSecretToken: null, hasWebhookSecret: true } as BotToken);
  assert.equal(result.hasWebhookSecret, false);
});
