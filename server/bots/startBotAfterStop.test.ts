/** @fileoverview Проверка ожидания блокировки после остановки или аварии бота. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startBotAfterStop } from './startBotAfterStop';

test('повторный запуск ждёт освобождения блокировки и сохраняет журнал', async () => {
  let received: unknown;
  const result = await startBotAfterStop(1, 'token', 2, false, async (...args) => {
    received = args;
    return { success: true };
  });
  assert.equal(result.success, true);
  assert.deepEqual(received, [1, 'token', 2, { clearLogs: false, waitForExistingLock: true }]);
});
