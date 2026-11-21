/** @fileoverview Проверяет безопасные причины polling и принадлежность отказа текущему запуску. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { resolveWorkerPollingFailure, isWorkerPollingFailure } from './workerPollingFailure';
import { resolveWorkerExitError } from './workerExitDiagnostic';

/** Подтверждённый отказ транспорта конкретного запуска без исходного секрета. */
const event = { type: 'bot_runtime_error', code: 'telegram_polling_rejected', source: 'telegram_bot_api',
  method: 'getUpdates', launch_id: 123, telegram_code: 409, reason: 'polling_conflict',
  tokenFingerprint: createHash('sha256').update('test-secret').digest('hex') };

test('различает другого получателя, webhook и нераспознанный отказ Telegram', () => {
  const conflict = resolveWorkerPollingFailure(event, 'test-secret', 123)!;
  assert.match(conflict, /409.*другой процесс/);
  assert.match(resolveWorkerPollingFailure({ ...event, reason: 'webhook_conflict' }, 'test-secret', 123)!, /409.*webhook/);
  assert.equal(resolveWorkerPollingFailure({ ...event, reason: 'telegram_rejected' }, 'test-secret', 123),
    'Telegram polling: отказ Bot API, код 409');
  assert.equal(isWorkerPollingFailure(conflict), true);
  assert.equal(isWorkerPollingFailure('Предупреждение'), false);
  assert.equal(resolveWorkerExitError('error', conflict), `Ошибка выполнения: ${conflict}`);
  assert.doesNotMatch(conflict, /test-secret|Unauthorized|FROZEN_METHOD_INVALID/);
});

test('не принимает устаревший запуск, заменённый секрет и поддельные поля события', () => {
  assert.equal(resolveWorkerPollingFailure(event, 'new-secret', 123), undefined);
  for (const launchId of [undefined, 0, -1, 123.5, NaN, 124])
    assert.equal(resolveWorkerPollingFailure(event, 'test-secret', launchId), undefined);
  for (const change of [{ type: 'stderr' }, { source: 'scenario' }, { code: 'telegram_unauthorized' },
    { method: 'setWebhook' }, { launch_id: '123' }, { tokenFingerprint: 'forged' },
    { telegram_code: '409' }, { telegram_code: 500 }, { reason: 'test-secret' },
    { telegram_code: 400, reason: 'polling_conflict' }, { telegram_code: 403, reason: 'webhook_conflict' }])
    assert.equal(resolveWorkerPollingFailure({ ...event, ...change }, 'test-secret', 123), undefined);
});
