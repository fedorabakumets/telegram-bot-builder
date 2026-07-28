/**
 * @fileoverview Unit-тесты безопасного payload token-updated
 * @module lib/tests/test-token-updated-payload
 */

import assert from 'node:assert/strict';
import {
  pickChangedSettings,
  toTokenUpdatedPayload,
} from '../../shared/project-sync/project-event.ts';

const base = {
  id: 170,
  projectId: 266,
  name: 'Test Bot',
  botUsername: 'test_bot',
  botFirstName: 'Test',
  isDefault: 1,
  isActive: 1,
  messagesRetentionDays: 7,
  autoRestart: 0,
  maxRestartAttempts: 3,
  logLevel: 'DEBUG',
  protectContent: 0,
  saveIncomingMedia: 0,
  catchAllHandlers: 1,
  contentCache: 1,
  launchMode: 'polling',
  webhookBaseUrl: null as string | null,
  userbotEnabled: 0,
};

/**
 * Проверяет whitelist и отсутствие секретов в payload
 */
function testNoSecretsInPayload(): void {
  const dirty = {
    ...base,
    token: '123:SECRET',
    webhookSecretToken: 'whsec',
    userbotApiHash: 'hash',
    userbotSessionString: 'sess',
  } as typeof base & Record<string, string>;
  const payload = toTokenUpdatedPayload(dirty);
  const json = JSON.stringify(payload);
  assert.equal(payload.messagesRetentionDays, 7);
  assert.ok(!('token' in payload));
  assert.ok(!json.includes('SECRET'));
  assert.ok(!json.includes('whsec'));
  assert.ok(!json.includes('hash'));
  assert.ok(!json.includes('sess'));
}

/**
 * Проверяет pickChangedSettings по одному полю
 */
function testPickChangedSettings(): void {
  const after = { ...base, messagesRetentionDays: 0 };
  const changed = pickChangedSettings(base, after);
  assert.deepEqual(changed, ['messagesRetentionDays']);
}

testNoSecretsInPayload();
testPickChangedSettings();
console.log('test-token-updated-payload: ok');
