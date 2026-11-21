/** @fileoverview Проверки машинного события отказа вместимости без имитации аварии процесса. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtimeFailureEvent } from './runtimeFailureEvent';
import { MemoryPressureError } from './memoryAdmission';
import type { PollingBot } from './dispatcherTypes';
import { isWorkerMemoryRefusal } from '../../bots/workerMemoryRefusal';

test('отказ допуска передаётся менеджеру с источником, кодом и текущим запуском', () => {
  const bot = { tokenId: 45, env: { BOT_LAUNCH_ID: '7511' } } as unknown as PollingBot;
  const event = JSON.parse(runtimeFailureEvent(bot, new MemoryPressureError({ currentBytes: 400 }))!);
  assert.equal(event.source, 'runner_memory');
  assert.equal(event.code, 'memory_pressure');
  assert.equal(event.token_id, 45);
  assert.equal(event.launch_id, 7511);
  assert.equal(isWorkerMemoryRefusal(event, 7511), true);
  assert.equal(isWorkerMemoryRefusal(event, 7512), false);
});

test('обычная ошибка со словами о памяти не выдаётся за структурированный отказ', () => {
  const bot = { tokenId: 45, env: {} } as PollingBot;
  assert.equal(runtimeFailureEvent(bot, new Error('memory_pressure')), undefined);
  assert.equal(isWorkerMemoryRefusal({ source: 'stderr', code: 'memory_pressure' }), false);
});
