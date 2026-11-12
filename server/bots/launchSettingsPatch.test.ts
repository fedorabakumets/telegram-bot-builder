/** @fileoverview Проверки сохранения отсутствующего или скрытого секрета вебхука. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLaunchSettingsPatch } from './launchSettingsPatch';

test('смена способа доставки сохраняет отсутствующие поля вебхука', () => {
  assert.deepEqual(buildLaunchSettingsPatch({ launchMode: 'polling' }), { launchMode: 'polling' });
});

test('маска секрета не заменяет сохранённое значение', () => {
  for (const webhookSecretToken of ['••••••', '***', '…']) {
    assert.deepEqual(buildLaunchSettingsPatch({ launchMode: 'webhook', webhookSecretToken }), { launchMode: 'webhook' });
  }
});

test('явное очищение и новое значение остаются в изменении', () => {
  assert.deepEqual(buildLaunchSettingsPatch({ launchMode: 'webhook', webhookBaseUrl: null, webhookSecretToken: null }),
    { launchMode: 'webhook', webhookBaseUrl: null, webhookSecretToken: null });
  assert.equal(buildLaunchSettingsPatch({ launchMode: 'webhook', webhookSecretToken: 'new_secret' }).webhookSecretToken, 'new_secret');
});
