/** @fileoverview Реальные Redis и общий Python: webhook пробуждает обработчик и сохраняется во время сна. */
import { createServer } from 'node:http';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import Redis from 'ioredis';
import { expect, it } from 'vitest';
import { ProcessPollingRuntime } from './factory';
import { DemandQueue } from './queue';
import { eventually } from './integrationHelpers';
import { testPython } from './testPython';

it('webhook остаётся зарегистрированным между двумя холодными пробуждениями общего Python', async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6379';
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(redisUrl).hostname)) throw new Error('Разрешён только локальный Redis');
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const id = randomInt(700_000_000_000, 750_000_000_000);
  const token = `${id}:webhook_fixture_${id}`;
  const queue = new DemandQueue(redis, id);
  const state = `tbb:demand:{${id}}:state:99003:${id}`;
  const methods: string[] = [];
  const telegram = createServer(async (req, res) => {
    for await (const _chunk of req) { /* Полностью принимаем запрос регистрации. */ }
    methods.push(req.url!.split('/').pop()!);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, result: true }));
  });
  await new Promise<void>(done => telegram.listen(0, '127.0.0.1', done));
  const port = (telegram.address() as { port: number }).port;
  const lines: string[] = [];
  const runtime = new ProcessPollingRuntime({ runnerId: 'webhook-shared-test', redisUrl, pythonPath: testPython(),
    workerScript: resolve('server/python/worker.py'), cacheDir: resolve('output/shared-test-unused'),
    buildsKeep: 1, processPolling: 'node', processHandler: 'shared' }, line => lines.push(line));
  /** Извлекает счётчик сохранённого состояния и PID без доступа к пользовательским данным. */
  const handled = () => lines.flatMap(line => {
    const match = String(JSON.parse(line).content ?? '').match(/SHARED_HANDLED=(\d+) LABEL=\w+ PID=(\d+)/);
    return match ? [{ count: Number(match[1]), pid: Number(match[2]) }] : [];
  });
  try {
    await redis.ping();
    await runtime.dispatcher.start({ tokenId: id, token, projectId: 99003,
      botFile: resolve('server/runner/polling/fixtures/shared_state_bot.py'), idleTimeout: 0.2,
      workerKey: 'webhook-shared-test', instance: 'fixture', webhook: { url: `https://example.test/api/webhook/99003/${id}`, secret: 'fixture-secret' },
      env: { REDIS_URL: redisUrl, TELEGRAM_BOT_API_URL: `http://127.0.0.1:${port}`, SHARED_TEST_LABEL: 'webhook', BOT_WEBHOOK_INGRESS: 'node' } });
    await eventually(async () => methods.includes('setWebhook'));
    expect(runtime.counters().sharedHost?.pid).toBeUndefined();
    await eventually(async () => lines.some(line => JSON.parse(line).content === `bot_started:${id}`));
    expect(await runtime.webhook.enqueue(99003, id, { update_id: 10 }, 'fixture-secret')).toBe(true);
    await eventually(async () => handled().length === 1, 30_000);
    await eventually(async () => runtime.counters().sharedHost?.pid === undefined);
    expect(methods).toEqual(['setWebhook']);
    expect(await redis.get(state)).toContain('count');
    expect(await runtime.webhook.enqueue(99003, id, { update_id: 9 }, 'fixture-secret')).toBe(true);
    await eventually(async () => handled().length === 2, 30_000);
    await eventually(async () => runtime.counters().sharedHost?.pid === undefined);
    expect(handled().map(item => item.count)).toEqual([1, 2]);
    expect(handled()[1].pid).not.toBe(handled()[0].pid);
    expect(await queue.peek()).toBeNull();
    expect(methods).toEqual(['setWebhook']);
    await runtime.dispatcher.stop(id);
    expect(methods).toEqual(['setWebhook', 'deleteWebhook']);
  } finally {
    await runtime.shutdown();
    await redis.del(...queue.keys, queue.webhookSeenKey, state);
    redis.disconnect();
    telegram.closeAllConnections();
    await new Promise<void>((done, reject) => telegram.close(error => error ? reject(error) : done()));
  }
});
