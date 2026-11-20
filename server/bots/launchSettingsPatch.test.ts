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

/** Отдельная правка адреса или секрета не меняет источник транспорта. */
test('сохраняет самостоятельные настройки вебхука без передачи транспорта', () => {
  assert.deepEqual(buildLaunchSettingsPatch({ webhookBaseUrl: 'inherit' }), { webhookBaseUrl: 'inherit' });
  assert.deepEqual(buildLaunchSettingsPatch({ webhookBaseUrl: null }), { webhookBaseUrl: null });
  assert.deepEqual(buildLaunchSettingsPatch({ webhookSecretToken: 'new_secret' }), { webhookSecretToken: 'new_secret' });
  assert.deepEqual(buildLaunchSettingsPatch({ webhookSecretToken: '••••••' }), {});
});
