/** @fileoverview Проверки независимого наследования флага и лимита автоперезапуска. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBotAutoRestartBatch } from './botAutoRestartPatch';

/** Один запрос может изменить флаг и вернуть наследование лимита. */
test('пакет сохраняет явное выключение и отдельно возвращает общий лимит', () => {
  assert.deepEqual(parseBotAutoRestartBatch([
    { action: 'update', key: 'AUTO_RESTART', value: '0' },
    { action: 'update', key: 'MAX_RESTART_ATTEMPTS', value: 'inherit' },
  ]), { autoRestart: 0, inheritAutoRestart: false, inheritMaxRestartAttempts: true });
});

/** Частичный запрос не меняет источник отсутствующего поля. */
test('индивидуальный лимит не меняет источник флага', () => {
  assert.deepEqual(parseBotAutoRestartBatch([
    { action: 'update', key: 'MAX_RESTART_ATTEMPTS', value: '10' },
  ]), { maxRestartAttempts: 10, inheritMaxRestartAttempts: false });
  assert.throws(() => parseBotAutoRestartBatch([
    { action: 'update', key: 'MAX_RESTART_ATTEMPTS', value: '11' },
  ]), /от 1 до 10/);
});
