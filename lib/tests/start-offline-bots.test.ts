/**
 * @fileoverview Unit: фильтр офлайн для bulk start + payload progress без секретов
 * @module lib/tests/start-offline-bots.test
 */

import assert from 'node:assert/strict';
import { isTokenOfflineForBulkStart } from '../../shared/is-token-offline-for-bulk-start.ts';
import { toStartOfflineProgressPayload } from '../../shared/project-sync/project-event.ts';

/**
 * Offline = нет status или не running
 */
function testOfflineFilter(): void {
  assert.equal(isTokenOfflineForBulkStart(undefined), true);
  assert.equal(isTokenOfflineForBulkStart(null), true);
  assert.equal(isTokenOfflineForBulkStart('stopped'), true);
  assert.equal(isTokenOfflineForBulkStart('error'), true);
  assert.equal(isTokenOfflineForBulkStart('running'), false);
  assert.equal(isTokenOfflineForBulkStart('stopped', 0), false);
  assert.equal(isTokenOfflineForBulkStart('stopped', 1), true);
  assert.equal(isTokenOfflineForBulkStart('running', 0), false);
}

/**
 * Payload прогресса не содержит секретов
 */
function testProgressPayloadNoSecrets(): void {
  const dirty = {
    started: 1,
    failed: 0,
    skipped: 2,
    total: 3,
    currentTokenId: 70,
    status: 'running' as const,
    source: 'api' as const,
    token: '123:SECRET',
  };
  const payload = toStartOfflineProgressPayload(dirty);
  const json = JSON.stringify(payload);
  assert.equal(payload.started, 1);
  assert.equal(payload.total, 3);
  assert.ok(!('token' in payload));
  assert.ok(!json.includes('SECRET'));
}

testOfflineFilter();
testProgressPayloadNoSecrets();

/**
 * Confirm-gate MCP: без confirm HTTP не уходит (чистая проверка текста ошибки)
 */
async function testConfirmGate(): Promise<void> {
  const { startOfflineBotsInDb } = await import('../../lib/bot-tools/bot-runtime-db.ts');
  const denied = await startOfflineBotsInDb(1, { confirm: false });
  assert.ok('error' in denied);
  assert.match(denied.error, /confirm: true/);
}

await testConfirmGate();
console.log('start-offline-bots.test: ok');
