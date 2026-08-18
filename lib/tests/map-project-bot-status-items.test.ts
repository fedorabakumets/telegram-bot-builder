/**
 * @fileoverview Сборка публичных статусов ботов проекта без секрета token
 * @module lib/tests/map-project-bot-status-items.test
 */

import assert from 'node:assert/strict';
import { mapProjectBotStatusItems } from '../../server/routes/botManagement/map-project-bot-status-items.ts';

function testStripsTokenAndFillsStopped(): void {
  const instances = new Map<number, { token?: string | null; status?: string; id: number }>([
    [7, { id: 1, token: '123:SECRET', status: 'running' }],
  ]);
  const items = mapProjectBotStatusItems(
    [7, 8],
    instances,
    (tokenId) => (tokenId === 7 ? 'running' : 'stopped'),
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].tokenId, 7);
  assert.equal(items[0].status, 'running');
  assert.equal(items[0].instance && 'token' in items[0].instance ? items[0].instance.token : undefined, undefined);
  const json = JSON.stringify(items);
  assert.ok(!json.includes('SECRET'));
  assert.deepEqual(items[1], { tokenId: 8, status: 'stopped', instance: null });
}

testStripsTokenAndFillsStopped();
console.log('map-project-bot-status-items.test: ok');
