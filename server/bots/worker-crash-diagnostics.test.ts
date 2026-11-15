/** @fileoverview Проверяет доставку причины смерти обработчика вместо предупреждения бота. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workerManager } from './botWorkerManager';

test('старое предупреждение не маскирует SIGKILL и признак восстановления', () => {
  const manager = workerManager as any;
  const tokenId = 995010;
  const exits: unknown[][] = [];
  /** Запоминает аргументы выхода для проверки доверенного признака смерти процесса. */
  const listener = (...args: unknown[]) => exits.push(args);
  workerManager.on('bot-exited', listener);
  manager.tokenProjects.set(tokenId, 9);
  manager.projectWorkerKeys.set(9, 0);
  try {
    manager.handleWorkerMessage(0, { type: 'stderr', token_id: tokenId, level: 'WARNING',
      content: '🔗 [DeepLink] fallback на старт' });
    assert.equal(manager.lastBotErrors.has(tokenId), false);
    manager.handleWorkerMessage(0, { type: 'worker_host_crash', token_id: tokenId, exit_code: null, signal: 'SIGKILL' });
    manager.handleWorkerMessage(0, { type: 'stderr', token_id: tokenId, content: 'Ошибка очистки после остановки' });
    manager.handleSystemMessage(0, `bot_exited:${tokenId}:error`);
    assert.equal(exits.length, 1);
    assert.match(String(exits[0][3]), /^\[worker_host_crash\].*SIGKILL/);
    assert.equal(exits[0][4], true);
    assert.equal(manager.workerHostCrashes.has(tokenId), false);
  } finally {
    workerManager.off('bot-exited', listener);
    manager.tokenProjects.delete(tokenId);
    manager.lastBotErrors.delete(tokenId);
    manager.workerHostCrashes.delete(tokenId);
    manager.projectWorkerKeys.delete(9);
  }
});

test('отказ Telegram не заменяется смертью обработчика и не получает инфраструктурный повтор', () => {
  const manager = workerManager as any;
  const tokenId = 995011;
  const exits: unknown[][] = [];
  /** Сохраняет окончательную причину выхода токена. */
  const listener = (...args: unknown[]) => exits.push(args);
  workerManager.on('bot-exited', listener);
  manager.tokenProjects.set(tokenId, 9);
  manager.projectWorkerKeys.set(9, 0);
  try {
    manager.lastBotErrors.set(tokenId, 'TelegramBadRequest: FROZEN_METHOD_INVALID');
    manager.handleWorkerMessage(0, { type: 'worker_host_crash', token_id: tokenId, exit_code: 1, signal: null });
    manager.handleSystemMessage(0, `bot_exited:${tokenId}:error`);
    assert.equal(exits[0][3], 'TelegramBadRequest: FROZEN_METHOD_INVALID');
    assert.equal(exits[0][4], false);
  } finally {
    workerManager.off('bot-exited', listener);
    manager.tokenProjects.delete(tokenId);
    manager.lastBotErrors.delete(tokenId);
    manager.workerHostCrashes.delete(tokenId);
    manager.projectWorkerKeys.delete(9);
  }
});

test('сообщение другой группы не помечает бота как жертву общего падения', () => {
  const manager = workerManager as any;
  const tokenId = 995012;
  manager.tokenProjects.set(tokenId, 9);
  manager.projectWorkerKeys.set(9, 0);
  try {
    manager.handleWorkerMessage(123, { type: 'worker_host_crash', token_id: tokenId, exit_code: 1, signal: null });
    assert.equal(manager.workerHostCrashes.has(tokenId), false);
  } finally {
    manager.tokenProjects.delete(tokenId);
    manager.projectWorkerKeys.delete(9);
    manager.workerHostCrashes.delete(tokenId);
  }
});
