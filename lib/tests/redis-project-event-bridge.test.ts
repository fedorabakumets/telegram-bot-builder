/**
 * @fileoverview Unit-тесты anti-loop Redis project_event bridge
 * @module lib/tests/redis-project-event-bridge.test
 */

import assert from 'node:assert/strict';
import {
  shouldSkipBridgedProjectEvent,
  type ProjectEvent,
} from '../../shared/project-sync/project-event.ts';

/**
 * Создаёт минимальное ProjectEvent для теста
 * @param originInstanceId - ID инстанса-источника
 * @returns Событие
 */
function makeEvent(originInstanceId?: string): ProjectEvent {
  return {
    type: 'token-updated',
    projectId: 266,
    tokenId: 170,
    timestamp: new Date().toISOString(),
    originInstanceId,
    data: { changedFields: ['messagesRetentionDays'], token: { id: 170 } },
  };
}

/**
 * Своё сообщение из Redis пропускается
 */
function testSkipOwnInstance(): void {
  assert.equal(shouldSkipBridgedProjectEvent(makeEvent('inst-a'), 'inst-a'), true);
}

/**
 * Чужое сообщение применяется
 */
function testApplyRemoteInstance(): void {
  assert.equal(shouldSkipBridgedProjectEvent(makeEvent('inst-b'), 'inst-a'), false);
}

/**
 * Без originInstanceId — не скипаем (legacy / local-only)
 */
function testNoOriginApplies(): void {
  assert.equal(shouldSkipBridgedProjectEvent(makeEvent(undefined), 'inst-a'), false);
}

testSkipOwnInstance();
testApplyRemoteInstance();
testNoOriginApplies();
console.log('test-redis-project-event-bridge: ok');
