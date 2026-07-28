/**
 * @fileoverview Unit: ACL DTO маскирования + MCP confirm delete + UI selectCurrentAndPast
 * @module lib/tests/token-acl-and-launch-sync.test
 */

import assert from 'node:assert/strict';
import { maskBotToken, toPublicBotToken, toPublicBotInstance, isMaskedOrPlaceholderToken } from '../../server/routes/botTokens/to-public-bot-token.ts';
import { selectCurrentAndPast } from '../../client/components/editor/bot/card/select-current-launch.ts';
import type { BotToken } from '../../shared/schema/index.ts';
import type { BotLaunchHistory } from '../../shared/schema/index.ts';
/**
 * Маска токена не содержит секрет после двоеточия
 */
function testMaskBotToken(): void {
  const masked = maskBotToken('8874346175:AAGTJ7eSOytnwso6SECRET');
  assert.equal(masked, '8874346175:••••••••');
  assert.ok(!masked.includes('SECRET'));
  assert.equal(maskBotToken(''), '');
  assert.equal(isMaskedOrPlaceholderToken('8874346175:••••••••'), true);
  assert.equal(isMaskedOrPlaceholderToken('111:ABC-real_token'), false);
}

/**
 * Public DTO вырезает секреты
 */
function testPublicDto(): void {
  const raw = {
    id: 1,
    projectId: 1,
    ownerId: 1,
    name: 't',
    token: '111:SECRETVALUE',
    webhookSecretToken: 'whsec',
    userbotApiHash: 'hash',
    userbotSessionString: 'sess',
  } as BotToken;
  const pub = toPublicBotToken(raw);
  assert.ok(!pub.token.includes('SECRET'));
  assert.equal(pub.webhookSecretToken, null);
  assert.equal(pub.userbotApiHash, null);
  assert.equal(pub.userbotSessionString, null);

  const inst = toPublicBotInstance({ id: 1, token: '111:SECRET', status: 'stopped' });
  assert.equal('token' in inst && (inst as { token?: string }).token, false);
  assert.ok(!JSON.stringify(inst).includes('SECRET'));
}

/**
 * Offline + orphan running → UI не показывает Онлайн
 */
function testSelectCurrentOfflineOrphan(): void {
  const history = [
    {
      id: 10,
      projectId: 1,
      tokenId: 1,
      status: 'running',
      startedAt: new Date('2026-06-12T00:00:00Z'),
      stoppedAt: null,
      errorMessage: null,
      processId: 'worker_1',
    },
  ] as BotLaunchHistory[];
  const { current } = selectCurrentAndPast(history, false, false);
  assert.ok(current);
  assert.equal(current!.status, 'stopped');
}

/**
 * Online → предпочитает running
 */
function testSelectCurrentLive(): void {
  const history = [
    {
      id: 2,
      projectId: 1,
      tokenId: 1,
      status: 'stopped',
      startedAt: new Date('2026-07-01T00:00:00Z'),
      stoppedAt: new Date(),
      errorMessage: null,
      processId: null,
    },
    {
      id: 1,
      projectId: 1,
      tokenId: 1,
      status: 'running',
      startedAt: new Date('2026-07-02T00:00:00Z'),
      stoppedAt: null,
      errorMessage: null,
      processId: 'worker_1',
    },
  ] as BotLaunchHistory[];
  // find first running in array order
  const { current } = selectCurrentAndPast(history, true, false);
  assert.equal(current?.status, 'running');
}

testMaskBotToken();
testPublicDto();
testSelectCurrentOfflineOrphan();
testSelectCurrentLive();

/**
 * MCP delete без confirm
 */
async function testDeleteConfirmGate(): Promise<void> {
  const { deleteBotTokenInDb } = await import('../../lib/bot-tools/bot-runtime-db.ts');
  const denied = await deleteBotTokenInDb(1, 61, { confirm: false });
  assert.ok('error' in denied);
  assert.match(denied.error, /confirm: true/);
}

await testDeleteConfirmGate();
console.log('token-acl-and-launch-sync.test: ok');
