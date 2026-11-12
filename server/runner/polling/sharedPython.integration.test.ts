/** @fileoverview Сквозная проверка ленивого общего Python: сон, освобождение процесса и восстановление состояния. */
import { randomInt } from "node:crypto";
import { resolve } from "node:path";
import Redis from "ioredis";
import { expect, it } from "vitest";
import { ProcessPollingRuntime } from "./factory";
import { DemandQueue } from "./queue";
import { eventually, fakeTelegram } from "./integrationHelpers";

it("общий PID существует только при работе ботов, сохраняя состояние после повторного холодного пробуждения", async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379";
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(redisUrl).hostname))
    throw new Error("Сквозной тест разрешает только локальный Redis");
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const ids = [randomInt(600_000_000_000, 650_000_000_000), randomInt(650_000_000_000, 699_000_000_000)];
  const tokens = ids.map(id => `${id}:shared_fixture_${id}`);
  const queues = ids.map(id => new DemandQueue(redis, id));
  const states = ids.map(id => `tbb:demand:{${id}}:state:99003:${id}`);
  const batches = new Map(tokens.map(token => [token, [] as { update_id: number }[]]));
  const telegram = await fakeTelegram(batches);
  const lines: string[] = [];
  const runtime = new ProcessPollingRuntime({ runnerId: "shared-integration", redisUrl,
    pythonPath: resolve(process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python"),
    workerScript: resolve("server/python/worker.py"), cacheDir: resolve("output/shared-test-unused"),
    buildsKeep: 1, processPolling: "node", processHandler: "shared" }, line => lines.push(line), 2);
  /** Извлекает только технические маркеры тестового сценария из очищенного вывода. */
  const handled = () => lines.flatMap(line => {
    const event = JSON.parse(line);
    const match = String(event.content ?? "").match(/SHARED_HANDLED=(\d+) LABEL=(\w+) PID=(\d+) LIBRARY=(\w+) LOCAL=(\d+)/);
    return match ? [{ count: Number(match[1]), label: match[2], pid: Number(match[3]), library: match[4], local: Number(match[5]) }] : [];
  });
  let pid: number | undefined;
  try {
    await redis.ping();
    await Promise.all(ids.map((tokenId, index) => runtime.dispatcher.start({ tokenId, token: tokens[index],
      botFile: resolve("server/runner/polling/fixtures/shared_state_bot.py"), projectId: 99003,
      idleTimeout: index === 0 ? 0.35 : 2, workerKey: "shared-integration", instance: "fixture",
      env: { REDIS_URL: redisUrl, TELEGRAM_BOT_API_URL: telegram.base, SHARED_TEST_LABEL: `bot${index}` } })));
    expect(runtime.counters().sharedHost?.pid).toBeUndefined();
    expect(runtime.counters().sharedHost?.activeHandlers).toBe(0);
    expect(runtime.counters().memoryKb).toBe(0);
    for (const token of tokens) batches.set(token, [{ update_id: 1 }, { update_id: 1 }]);
    await eventually(async () => handled().length === 2, 30_000);
    const first = handled();
    expect(first.map(item => item.label).sort()).toEqual(["bot0", "bot1"]);
    expect(first.map(item => item.count)).toEqual([1, 1]);
    expect(new Set(first.map(item => item.pid)).size).toBe(1);
    expect(new Set(first.map(item => item.library)).size).toBe(1);
    pid = first[0].pid;
    await eventually(async () => runtime.counters().children.length === 1
      && runtime.counters().children[0].tokenId === ids[1]);
    expect(() => process.kill(pid!, 0)).not.toThrow();
    await eventually(async () => runtime.counters().activeChildren === 0);
    await eventually(async () => runtime.counters().sharedHost?.pid === undefined);
    expect(() => process.kill(pid!, 0)).toThrow();
    expect(runtime.counters().memoryKb).toBe(0);
    expect(await Promise.all(queues.map(queue => queue.peek()))).toEqual([null, null]);
    for (const state of states) expect(await redis.get(state)).toContain("count");
    for (const token of tokens) batches.set(token, [{ update_id: 2 }]);
    await eventually(async () => handled().length === 4);
    const second = handled().slice(2);
    expect(second.map(item => item.count)).toEqual([2, 2]);
    expect(second.map(item => item.local)).toEqual([1, 1]);
    expect(new Set(second.map(item => item.pid)).size).toBe(1);
    expect(new Set(second.map(item => item.library)).size).toBe(1);
    expect(second.every(item => item.pid !== pid && item.library !== first[0].library)).toBe(true);
    const secondPid = second[0].pid;
    await eventually(async () => runtime.counters().activeChildren === 0);
    await eventually(async () => runtime.counters().sharedHost?.pid === undefined);
    expect(() => process.kill(secondPid, 0)).toThrow();
    expect(runtime.counters().memoryKb).toBe(0);
    expect(await Promise.all(queues.map(queue => queue.offset()))).toEqual([3, 3]);
    expect(await Promise.all(queues.map(queue => queue.peek()))).toEqual([null, null]);
    await Promise.all(ids.map(id => runtime.dispatcher.stop(id)));
    await runtime.shutdown();
    expect(() => process.kill(pid!, 0)).toThrow();
  } finally {
    await runtime.shutdown();
    await redis.del(...queues.flatMap(queue => queue.keys), ...states);
    redis.disconnect(); await telegram.close();
  }
});
