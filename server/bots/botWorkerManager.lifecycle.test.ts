/**
 * @fileoverview Тесты lifecycle-правил worker pool (без spawn)
 * @module server/bots/botWorkerManager.lifecycle.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseWorkerSystemMessage } from './parseWorkerSystemMessage';

/**
 * Симулирует учёт activeBots по правилам нового lifecycle
 * @param events - system content строки по порядку
 * @returns итоговое множество tokenId
 */
function simulateActiveBots(events: string[]): Set<number> {
  const active = new Set<number>();
  for (const raw of events) {
    const ev = parseWorkerSystemMessage(raw);
    if (ev.kind === 'bot_started' && ev.tokenId !== undefined) {
      active.add(ev.tokenId);
    }
    if ((ev.kind === 'bot_exited' || ev.kind === 'bot_stopped') && ev.tokenId !== undefined) {
      active.delete(ev.tokenId);
    }
  }
  return active;
}

describe('botWorkerManager lifecycle (pure)', () => {
  it('bot_started добавляет, bot_exited снимает', () => {
    const set = simulateActiveBots([
      'bot_started:2',
      'bot_started:75',
      'bot_exited:75:stopped',
    ]);
    assert.deepStrictEqual([...set].sort((a, b) => a - b), [2]);
  });

  it('после выхода последнего бота set пуст (можно killWorker)', () => {
    const set = simulateActiveBots([
      'bot_started:10',
      'bot_stopped:10',
    ]);
    assert.strictEqual(set.size, 0);
  });

  it('не удаляет чужие токены при exit одного', () => {
    const set = simulateActiveBots([
      'bot_started:2',
      'bot_started:14',
      'bot_exited:2:error',
    ]);
    assert.deepStrictEqual([...set], [14]);
  });
});
