/** @fileoverview Проверяет пять одновременных сценариев в настоящем общем Python поверх локального Redis. */
import { testPython } from "./testPython";
import { randomInt } from "node:crypto";
import { resolve } from "node:path";
import Redis from "ioredis";
import { expect, it } from "vitest";
import { ProcessPollingRuntime } from "./factory";
import { DemandQueue } from "./queue";
import { eventually, fakeTelegram } from "./integrationHelpers";

it("пятый сценарий запускается до сна первых четырёх в одном общем PID", async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379";
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(redisUrl).hostname))
    throw new Error("Сквозной тест разрешает только локальный Redis");
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const base = randomInt(710_000_000_000, 719_000_000_000);
  const ids = Array.from({ length: 5 }, (_, index) => base + index);
  const tokens = ids.map(id => `${id}:unlimited_fixture_${id}`);
  const queues = ids.map(id => new DemandQueue(redis, id));
  const states = ids.map(id => `tbb:demand:{${id}}:state:99005:${id}`);
  const batches = new Map(tokens.map(token => [token, [] as { update_id: number }[]]));
  const telegram = await fakeTelegram(batches);
  const lines: string[] = [];
  const runtime = new ProcessPollingRuntime({ runnerId: "unlimited-integration", redisUrl,
    pythonPath: testPython(),
    workerScript: resolve("server/python/worker.py"), cacheDir: resolve("output/shared-test-unused"),
    buildsKeep: 1, processPolling: "node", processHandler: "shared" }, line => lines.push(line), 4);
  /** Извлекает технические метки сценариев без пользовательских сообщений и токенов. */
  const handled = () => lines.flatMap(line => {
    const event = JSON.parse(line);
    const match = String(event.content ?? "").match(/SHARED_HANDLED=(\d+) LABEL=(\w+) PID=(\d+)/);
    return match ? [{ count: Number(match[1]), label: match[2], pid: Number(match[3]) }] : [];
  });
  try {
    await redis.ping();
    await Promise.all(ids.map((tokenId, index) => runtime.dispatcher.start({ tokenId, token: tokens[index],
      botFile: resolve("server/runner/polling/fixtures/shared_state_bot.py"), projectId: 99005,
      idleTimeout: 20, workerKey: "unlimited-integration", instance: "fixture",
      env: { REDIS_URL: redisUrl, TELEGRAM_BOT_API_URL: telegram.base, SHARED_TEST_LABEL: `bot${index}` } })));
    expect(runtime.counters().sharedHost?.pid).toBeUndefined();
    for (const token of tokens) batches.set(token, [{ update_id: 1 }, { update_id: 1 }]);
    await eventually(async () => handled().length === 5, 30_000);
    expect(handled().map(item => item.label).sort()).toEqual(["bot0", "bot1", "bot2", "bot3", "bot4"]);
    expect(handled().map(item => item.count)).toEqual([1, 1, 1, 1, 1]);
    expect(new Set(handled().map(item => item.pid)).size).toBe(1);
    expect(runtime.counters().activeChildren).toBe(5);
    expect(runtime.counters().sharedHost?.activeHandlers).toBe(5);
    await eventually(async () => (await Promise.all(queues.map(queue => queue.peek()))).every(item => item === null));
    await runtime.dispatcher.stop(ids[0]);
    expect(runtime.counters().sharedHost?.activeHandlers).toBe(4);
    batches.set(tokens[4], [{ update_id: 2 }]);
    await eventually(async () => handled().length === 6);
    expect(handled()[5]).toEqual({ label: "bot4", count: 2, pid: handled()[0].pid });
  } finally {
    await runtime.shutdown();
    await redis.del(...queues.flatMap(queue => queue.keys), ...states);
    redis.disconnect(); await telegram.close();
  }
});
