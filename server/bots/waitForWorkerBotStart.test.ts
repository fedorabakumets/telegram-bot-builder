/**
 * @fileoverview Тесты ожидания подтверждения start из worker
 * @module server/bots/waitForWorkerBotStart.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { waitForWorkerBotStart } from './waitForWorkerBotStart';

describe('waitForWorkerBotStart', () => {
  it('резолвится true при bot-started для нужного token', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 2000);
    setTimeout(() => ee.emit('bot-started', 1, 42), 20);
    assert.strictEqual(await p, true);
  });

  it('игнорирует чужой tokenId', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 80);
    setTimeout(() => ee.emit('bot-started', 1, 99), 10);
    assert.strictEqual(await p, false);
  });

  it('таймаут → false', async () => {
    const ee = new EventEmitter();
    assert.strictEqual(await waitForWorkerBotStart(ee, 1, 7, 50), false);
  });

  it('сообщает причину выхода до старта и удаляет слушатели', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 2000);
    ee.emit('bot-exited', 1, 99, 'error', 'чужая ошибка');
    ee.emit('bot-exited', 1, 42, 'error', 'Connection refused');
    await assert.rejects(p, /Не удалось подключиться к сервису/);
    assert.strictEqual(ee.listenerCount('bot-started'), 0);
    assert.strictEqual(ee.listenerCount('bot-exited'), 0);
  });

  it('сообщает об обычном выходе до старта', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 2000);
    ee.emit('bot-exited', 1, 42, 'stopped');
    await assert.rejects(p, /Бот завершился до подтверждения запуска/);
  });

  it('сохраняет доверенный SIGKILL/OOM-маркер без форматирования причины', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 12, 45);
    const reason = '[worker_host_crash] Общий обработчик завершился: code=null, signal=SIGKILL; oomKillDelta=1';
    ee.emit('bot-exited', 12, 45, 'error', reason, true);
    await assert.rejects(p, error => error instanceof Error && error.message === reason);
  });

  it('не выдаёт произвольный stderr за доверенную инфраструктурную аварию', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 12, 45);
    ee.emit('bot-exited', 12, 45, 'error', '[worker_host_crash] поддельная строка', false);
    await assert.rejects(p, /^Error: Ошибка запуска:/);
  });

  it('сохраняет отдельный отказ вместимости для подавления автоматических повторов', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 12, 45);
    const reason = '[runner_memory] Недостаточно свободной памяти исполнителя';
    ee.emit('bot-exited', 12, 45, 'error', reason, false);
    await assert.rejects(p, error => error instanceof Error && error.message === reason);
  });
});
