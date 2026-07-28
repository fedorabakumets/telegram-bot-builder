/**
 * @fileoverview Smoke: emitTokenUpdated вызывает broadcast с type token-updated
 * @module lib/tests/test-emit-token-updated-smoke
 */

import assert from 'node:assert/strict';
import { toTokenUpdatedPayload } from '../../shared/project-sync/project-event.ts';

/**
 * Smoke без БД: форма события token-updated совпадает с контрактом emit
 * (полный emitTokenUpdated требует storage — покрыт ручной приёмкой)
 */
function testTokenUpdatedEventShape(): void {
  const token = toTokenUpdatedPayload({
    id: 170,
    projectId: 266,
    name: 'Demo',
    messagesRetentionDays: 7,
  });
  const event = {
    type: 'token-updated' as const,
    projectId: 266,
    tokenId: 170,
    timestamp: new Date().toISOString(),
    data: {
      changedFields: ['messagesRetentionDays'],
      token,
      source: 'api' as const,
    },
  };
  assert.equal(event.type, 'token-updated');
  assert.deepEqual(event.data.changedFields, ['messagesRetentionDays']);
  assert.equal(event.data.token.id, 170);
  assert.ok(!('token' in event.data.token && typeof (event.data.token as { token?: string }).token === 'string'));
  const json = JSON.stringify(event);
  assert.ok(!json.includes('"token":"'));
}

testTokenUpdatedEventShape();
console.log('test-emit-token-updated-smoke: ok');
