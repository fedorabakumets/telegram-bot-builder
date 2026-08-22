/**
 * @fileoverview Тесты resolveStoppedErrorMessage / formatBotStatusLabel
 * @module server/bots/resolveStoppedErrorMessage.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveStoppedErrorMessage,
  formatBotStatusLabel,
} from './resolveStoppedErrorMessage';
import { SERVER_RESTART_MARKER } from './restoreSweepSelect';

describe('resolveStoppedErrorMessage', () => {
  it('сохраняет маркер __server_restart__ при переводе в stopped', () => {
    const result = resolveStoppedErrorMessage(SERVER_RESTART_MARKER, 'stopped');
    assert.strictEqual(result, SERVER_RESTART_MARKER);
  });

  it('записывает «Процесс завершен» для обычной остановки', () => {
    const result = resolveStoppedErrorMessage(null, 'stopped');
    assert.strictEqual(result, 'Процесс завершен');
  });

  it('не затирает маркер строкой «Процесс завершен» (регрессия опроса статуса)', () => {
    assert.notStrictEqual(
      resolveStoppedErrorMessage(SERVER_RESTART_MARKER, 'stopped'),
      'Процесс завершен',
    );
  });

  it('очищает error_message при running', () => {
    assert.strictEqual(resolveStoppedErrorMessage(SERVER_RESTART_MARKER, 'running'), null);
  });
});

describe('formatBotStatusLabel', () => {
  it('показывает «Восстанавливается» при restorePending', () => {
    assert.strictEqual(formatBotStatusLabel('stopped', true), '🟡 Восстанавливается');
  });

  it('показывает «Остановлен» без restorePending', () => {
    assert.strictEqual(formatBotStatusLabel('stopped', false), '🔴 Остановлен');
  });
});
