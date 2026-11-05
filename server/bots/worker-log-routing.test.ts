/**
 * @fileoverview Проверка маршрутизации логов общего воркера по проектам
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { workerManager } from './botWorkerManager';

describe('Маршрутизация логов воркера', () => {
  it('передаёт только логи токена с известным проектом', () => {
    const manager = workerManager as any;
    const events: number[] = [];
    const listener = (projectId: number) => events.push(projectId);
    workerManager.on('bot-log', listener);
    manager.tokenProjects.set(995001, 27);
    try {
      manager.handleWorkerMessage(0, { type: 'stdout', token_id: 995001, content: 'тест' });
      manager.handleWorkerMessage(0, { type: 'stdout', token_id: 995002, content: 'тест' });
      manager.handleWorkerMessage(123, { type: 'stdout', token_id: 995002, content: 'тест' });
      assert.deepEqual(events, [27]);
    } finally {
      manager.tokenProjects.delete(995001);
      workerManager.off('bot-log', listener);
    }
  });
});
