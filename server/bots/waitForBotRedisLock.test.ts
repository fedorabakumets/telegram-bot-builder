/** @fileoverview Проверка безопасного ожидания блокировки при восстановлении. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOT_LOCK_BUSY_ERROR, waitForBotRedisLock } from './waitForBotRedisLock';
import { startBotWithRetries } from './restoreRetry';
import { BOT_START_CANCELLED_ERROR, cancelBotStart, getBotStartRevision } from './botStartState';

test('дожидается истечения блокировки без её удаления', async () => {
  let checks = 0;
  let waits = 0;
  const result = await waitForBotRedisLock('123:abcdefghij', {
    checks: 4,
    exists: async (key) => { assert.equal(key, 'bot:lock:abcdefghij'); return ++checks < 3 ? 1 : 0; },
    wait: async () => { waits++; },
  });
  assert.equal(result, true);
  assert.equal(waits, 2);
});

test('остановка отменяет ожидающий освобождения блокировки запуск', async () => {
  const tokenId = 87654;
  const revision = getBotStartRevision(tokenId);
  let checks = 0;
  const result = await waitForBotRedisLock('token', {
    exists: async () => { checks++; return 1; },
    wait: async () => cancelBotStart(tokenId),
  }, true, () => getBotStartRevision(tokenId) !== revision);
  assert.equal(result, false);
  assert.equal(checks, 1);
});

test('не повторяет восстановление при занятой блокировке', async () => {
  let starts = 0;
  const result = await startBotWithRetries(1, 'token', 2, {
    startBotFn: async () => { starts++; return { success: false, error: BOT_LOCK_BUSY_ERROR }; },
  });
  assert.equal(result.success, false);
  assert.equal(result.attempts, 1);
  assert.equal(starts, 1);
});

test('ручной запуск не ждёт освобождения занятой блокировки', async () => {
  let checks = 0;
  let waits = 0;
  const result = await waitForBotRedisLock('token', {
    exists: async () => { checks++; return 1; },
    wait: async () => { waits++; },
  }, false);
  assert.equal(result, false);
  assert.equal(checks, 1);
  assert.equal(waits, 0);
});

test('остановка между попытками восстановления отменяет следующую попытку', async () => {
  let starts = 0;
  const tokenId = 87655;
  const result = await startBotWithRetries(1, 'token', tokenId, {
    startBotFn: async () => { starts++; return { success: false, error: 'ошибка' }; },
    waitFn: async () => cancelBotStart(tokenId),
  });
  assert.equal(result.error, BOT_START_CANCELLED_ERROR);
  assert.equal(starts, 1);
});
