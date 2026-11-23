/** @fileoverview Проверяет сохранение безопасной причины polling от lease до события завершения бота. */
import { describe, expect, it } from 'vitest';
import type Redis from 'ioredis';
import { PollingRejected } from './receiver';
import { withPollingLease } from './lease';
import { runtimeFailureEvent } from './runtimeFailureEvent';
import { NodePollingDispatcher } from './dispatcher';
import type { PollingBot } from './dispatcherTypes';

/** Фиктивный бот с идентификатором запуска без настоящего секрета Telegram. */
const bot: PollingBot = { projectId: 10, tokenId: 6, token: 'test-secret-token', botFile: '/test.py',
  env: { BOT_LAUNCH_ID: '72' }, idleTimeout: 30, workerKey: '0', instance: 'test-instance' };

describe('структурированный отказ polling', () => {
  it('сохраняет типизированную причину через освобождение lease', async () => {
    const failure = new PollingRejected(bot.token, 409, 'polling_conflict');
    const redis = { set: async () => 'OK', eval: async () => 1 } as unknown as Redis;
    await expect(withPollingLease(redis, bot.token, new AbortController().signal,
      async () => { throw failure; })).rejects.toBe(failure);
  });

  it('передаёт причину текущего запуска до bot_exited без секретов и произвольных строк', async () => {
    const events: string[] = [];
    let finish!: () => void;
    const done = new Promise<void>(resolve => { finish = resolve; });
    const dispatcher = new NodePollingDispatcher({
      hasPending: async () => false,
      receive: async () => { throw new PollingRejected(bot.token, 409, 'webhook_conflict'); },
      startChild: async () => { throw new Error('Python не должен запускаться'); },
      onError: (failedBot, error) => { events.push(runtimeFailureEvent(failedBot, error)!); },
      lifecycle: (_bot, state) => { events.push(state); if (state === 'error') finish(); },
    });
    await dispatcher.start(bot);
    await done;
    const event = JSON.parse(events[0]);
    expect(event).toMatchObject({ type: 'bot_runtime_error', token_id: 6, launch_id: 72,
      source: 'telegram_bot_api', code: 'telegram_polling_rejected', telegram_code: 409,
      reason: 'webhook_conflict', method: 'getUpdates' });
    expect(event.tokenFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(events.slice(1)).toEqual(['error']);
    expect(events.join()).not.toContain(bot.token);
    expect(runtimeFailureEvent(bot, new Error('409 test-secret-token'))).toBeUndefined();
    await dispatcher.shutdown();
  });
});
