/** @fileoverview Проверки автоматического секрета Telegram webhook без подключения к БД. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveWebhookSecret } from './webhookSecretValue';

test('создаёт независимые секреты допустимого формата', () => {
  const first = resolveWebhookSecret(null);
  assert.match(first, /^[A-Za-z0-9_-]{64}$/);
  assert.notEqual(first, resolveWebhookSecret(''));
  assert.equal(resolveWebhookSecret('existing_secret'), 'existing_secret');
});
