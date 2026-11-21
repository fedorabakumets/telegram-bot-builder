/** @fileoverview Проверки подтверждённого завершения группы удалённого исполнителя. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunnerEvent } from '../redis/workerStreams';
import { RunnerWorkers } from './runnerWorkers';

/**
 * Создаёт виртуальную группу без Python, Redis или внешних подключений.
 * @param requireFence - Включить проверку актуальности команд.
 * @returns Исполнитель и собранный поток событий.
 */
function fixture(requireFence = true) {
  const events: RunnerEvent[] = [];
  const workers = new RunnerWorkers({
    runnerId: 'fixture', redisUrl: 'redis://unused', processPolling: 'node', pythonPath: 'unused',
    workerScript: 'unused', cacheDir: 'unused', buildsKeep: 1, requireFence,
  }, event => events.push(event));
  return { workers, events };
}

test('подтверждает завершение только точного текущего экземпляра и передаёт доказательство до exit', async () => {
  const { workers, events } = fixture();
  try {
    await workers.handle({ k: 'spawn', w: '7', i: 'current' });
    await workers.handle({ k: 'retire', w: '7', i: 'old', q: 'stale' });
    assert.equal(workers.size, 1);
    assert.deepEqual(events.find(event => event.k === 'retired'), {
      k: 'retired', w: '7', i: 'old', q: 'stale', confirmed: '0',
    });

    await workers.handle({ k: 'retire', w: '7', i: 'current', q: 'verified' });
    assert.equal(workers.size, 0);
    const terminal = events.filter(event => (event.k === 'retired' || event.k === 'exit') && event.i === 'current');
    assert.deepEqual(terminal.map(event => [event.k, event.q, event.confirmed]), [
      ['retired', 'verified', '1'],
      ['exit', undefined, undefined],
    ]);
  } finally {
    await workers.shutdown();
  }
});

test('отказывает без проверки актуальности команд и сохраняет исходную группу', async () => {
  const { workers, events } = fixture(false);
  try {
    await workers.handle({ k: 'spawn', w: '7', i: 'current' });
    await workers.handle({ k: 'retire', w: '7', i: 'current', q: 'unfenced' });
    assert.equal(workers.size, 1);
    assert.equal(events.find(event => event.q === 'unfenced')?.confirmed, '0');
    assert.equal(events.some(event => event.k === 'exit'), false);
  } finally {
    await workers.shutdown();
  }
});

test('сохраняет общий воркер с активным или ожидающим запуска ботом', async () => {
  const { workers, events } = fixture();
  try {
    await workers.handle({ k: 'spawn', w: '7', i: 'shared' });

    /** Подменяет подтверждения ботов вместо запуска Telegram-процессов. */
    const active = (workers as unknown as {
      /** Состояние групп синтетического исполнителя. */
      workers: Map<string, {
        /** Активные боты. */
        tokenIds: Set<number>;
        /** Ожидающие подтверждения запуска боты. */
        pendingTokenIds: Set<number>;
      }>;
    }).workers.get('7');
    assert.ok(active);
    active.tokenIds.add(62);
    await workers.handle({ k: 'retire', w: '7', i: 'shared', q: 'sibling-active' });
    assert.deepEqual(workers.snapshot().workers[0]?.tokenIds, [62]);
    assert.equal(events.find(event => event.q === 'sibling-active')?.confirmed, '0');

    active.tokenIds.clear();
    active.pendingTokenIds.add(63);
    await workers.handle({ k: 'retire', w: '7', i: 'shared', q: 'sibling-pending' });
    assert.deepEqual(workers.snapshot().workers[0]?.pendingTokenIds, [63]);
    assert.equal(events.find(event => event.q === 'sibling-pending')?.confirmed, '0');
    assert.equal(events.some(event => event.k === 'exit'), false);
  } finally {
    await workers.shutdown();
  }
});
