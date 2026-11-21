/** @fileoverview Регрессии сохранения SIGKILL/OOM при выходе канала общего воркера. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerProcessExit } from './workerProcessExit';

test('запускаемый бот получает проверенную общую OOM-причину вместо NaN', () => {
  const reason = '[worker_host_crash] Общий обработчик завершился: code=null, signal=SIGKILL; oomKillDelta=1';
  assert.deepEqual(workerProcessExit(Number.NaN, 'SIGKILL', false, reason), {
    status: 'error', runtimeError: reason, unexpected: true,
  });
});

test('сигнал без измерений остаётся SIGKILL, но не объявляется OOM', () => {
  const result = workerProcessExit(null, 'SIGKILL', false);
  assert.equal(result.status, 'error');
  assert.equal(result.unexpected, true);
  assert.match(result.runtimeError!, /code=null, signal=SIGKILL/);
  assert.doesNotMatch(result.runtimeError!, /NaN|OOM|oomKill/);
});

test('нулевой выход и намеренное завершение не разрешают восстановление', () => {
  assert.deepEqual(workerProcessExit(0, null, false), { status: 'stopped', unexpected: false });
  assert.deepEqual(workerProcessExit(null, 'SIGKILL', true), { status: 'stopped', unexpected: false });
});

test('подтверждённый отказ Telegram не заменяется общей инфраструктурной причиной', () => {
  const result = workerProcessExit(null, 'SIGKILL', false,
    '[worker_host_crash] SIGKILL', 'TelegramUnauthorizedError: Telegram отклонил токен');
  assert.equal(result.unexpected, false);
  assert.match(result.runtimeError!, /TelegramUnauthorizedError/);
});
