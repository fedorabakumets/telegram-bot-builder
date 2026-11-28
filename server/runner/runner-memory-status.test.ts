/** @fileoverview Отказ запуска по памяти удаляет устаревший онлайн-статус из снимка исполнителя. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunnerEvent } from '../redis/workerStreams';
import { RunnerWorkers } from './runnerWorkers';

test('отказ перезапуска убирает активный токен и webhook, сохраняя соседнего бота', async () => {
  const events: RunnerEvent[] = [];
  const workers = new RunnerWorkers({
    runnerId: 'fixture', redisUrl: 'redis://unused', processPolling: 'node', pythonPath: 'unused',
    workerScript: 'unused', cacheDir: 'unused', buildsKeep: 1,
  }, event => events.push(event));
  try {
    await workers.handle({ k: 'spawn', w: '13', i: 'current' });
    /** Имитирует оставшийся учёт остановленного процесса и отказ допуска нового запуска. */
    const worker = (workers as unknown as {
      /** Группы виртуального исполнителя. */
      workers: Map<string, {
        /** Подтверждённые ранее запуски. */
        tokenIds: Set<number>;
        /** Маршруты webhook. */
        webhookProjects: Map<number, number>;
        /** Канал отправки команды запуска. */
        channel: {
          /** Отправляет команду либо сообщает отказ запуска. */
          sendAsync: (line: string) => Promise<void>;
        };
      }>;
    }).workers.get('13');
    assert.ok(worker);
    worker.tokenIds.add(92);
    worker.tokenIds.add(93);
    worker.webhookProjects.set(92, 13);
    worker.webhookProjects.set(93, 13);
    /** Воспроизводит отказ памяти без Python и подключения к Telegram. */
    worker.channel.sendAsync = async () => {
      throw Object.assign(new Error('Недостаточно свободной памяти исполнителя'), { code: 'memory_pressure' });
    };
    await workers.handle({ k: 'line', w: '13', i: 'current',
      l: JSON.stringify({ cmd: 'start_bot', token_id: 92, bot_file: 'unused.py' }) });
    const snapshot = workers.snapshot().workers[0];
    assert.deepEqual(snapshot.tokenIds, [93]);
    assert.deepEqual(snapshot.pendingTokenIds, []);
    assert.equal(workers.hasWebhook(13, 92), false);
    assert.equal(workers.hasWebhook(13, 93), true);
    assert.ok(events.some(event => event.l && JSON.parse(event.l).content === 'bot_exited:92:error'));
  } finally {
    await workers.shutdown();
  }
});
