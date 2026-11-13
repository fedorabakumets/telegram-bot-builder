/** @fileoverview Настоящий общий PID постоянного и спящего ботов с независимым состоянием и остановкой. */
import { randomInt } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Redis from "ioredis";
import { expect, it, vi } from "vitest";
import { RunnerWorkers } from "../runnerWorkers";
import type { RunnerEvent } from "../../redis/workerStreams";
import { DemandQueue } from "./queue";
import { eventually, fakeTelegram } from "./integrationHelpers";
import { testPython } from "./testPython";

/** Прерывает тест при попытке обратиться к настоящему Telegram. */
vi.mock("./transport", async importOriginal => {
  const actual = await importOriginal<typeof import("./transport")>();
  return { ...actual, requestUpdates: (token: string, payload: object, signal: AbortSignal, apiBase?: string) => {
    if (!apiBase?.startsWith("http://127.0.0.1:")) throw new Error("Тест разрешает только локальный Telegram");
    return actual.requestUpdates(token, payload, signal, apiBase);
  } };
});

it("direct удерживает общий PID, process спит независимо и восстанавливается после полного освобождения", async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379";
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(redisUrl).hostname))
    throw new Error("Сквозной тест разрешает только локальный Redis");
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
  const ids = [randomInt(810_000_000_000, 820_000_000_000), randomInt(820_000_000_000, 830_000_000_000)];
  const tokens = ids.map(id => `${id}:unified_fixture_${id}`);
  const queues = ids.map(id => new DemandQueue(redis, id));
  const state = `tbb:demand:{${ids[1]}}:state:99004:${ids[1]}`;
  const batches = new Map(tokens.map(token => [token, [] as { update_id: number }[]]));
  const telegram = await fakeTelegram(batches);
  const cacheDir = await mkdtemp(join(tmpdir(), "tbb-unified-integration-"));
  const events: RunnerEvent[] = [];
  const workers = new RunnerWorkers({ runnerId: "unified-integration", redisUrl,
    pythonPath: testPython(), workerScript: resolve("server/python/worker.py"), cacheDir, buildsKeep: 1,
    requireFence: false, processPolling: "node", processHandler: "shared", pythonHost: "unified" },
    event => events.push(event));
  /** Передаёт команды по реальному маршруту панели. */
  const command = (payload: object) => workers.handle({ k: "line", w: "99004", i: "unified-fixture", l: JSON.stringify(payload) });
  /** Извлекает только заданные технические маркеры сценариев. */
  const markers = (pattern: RegExp) => events.flatMap(event => {
    if (!event.l) return [];
    const match = String(JSON.parse(event.l).content ?? "").match(pattern);
    return match ? [match] : [];
  });
  /** Возвращает события конкретного выгружаемого сценария. */
  const handled = () => markers(/SHARED_HANDLED=(\d+) LABEL=(\w+) PID=(\d+) LIBRARY=(\w+) LOCAL=(\d+)/);
  /** Запускает сценарий с отдельным окружением без реальных токенов. */
  const start = (index: number) => command({ cmd: "start_bot", token_id: ids[index], token: tokens[index],
    bot_file: resolve(`server/runner/polling/fixtures/${index ? "shared_state_bot" : "unified_permanent_bot"}.py`),
    env: { BOT_POLLING_MODE: index ? "process" : "direct", BOT_ON_DEMAND_IDLE_SECONDS: "0.6",
      BOT_ON_DEMAND_MAX_ACTIVE: "0", REDIS_URL: redisUrl, TELEGRAM_BOT_API_URL: telegram.base,
      SHARED_TEST_LABEL: index ? "demand" : "permanent" } });
  try {
    await redis.ping();
    await workers.handle({ k: "spawn", w: "99004", i: "unified-fixture" });
    await start(0); await start(1);
    await eventually(async () => markers(/PERMANENT_TICK=(\d+) PID=(\d+) LABEL=permanent/).length > 1, 30_000);
    const permanentPid = Number(markers(/PERMANENT_TICK=(\d+) PID=(\d+) LABEL=permanent/)[0][2]);
    batches.set(tokens[1], [{ update_id: 1 }]);
    await eventually(async () => handled().length === 1, 30_000);
    expect(Number(handled()[0][3])).toBe(permanentPid);
    expect(handled()[0][1]).toBe("1");
    const active = workers.memoryCounters().workers[0];
    expect(active.legacy).toBeNull();
    expect(active.unifiedHost?.permanentTokenIds).toEqual([ids[0]]);
    expect(active.unifiedHost?.handlerTokenIds).toEqual([ids[1]]);
    expect(active.pythonMemoryKb).toBe(active.unifiedHost?.memoryKb);
    await eventually(async () => workers.memoryCounters().workers[0].polling?.activeChildren === 0);
    expect(() => process.kill(permanentPid, 0)).not.toThrow();
    expect(await redis.get(state)).toContain("count");
    const tickCount = markers(/PERMANENT_TICK=(\d+) PID=(\d+) LABEL=permanent/).length;
    await eventually(async () => markers(/PERMANENT_TICK=(\d+) PID=(\d+) LABEL=permanent/).length > tickCount);
    batches.set(tokens[1], [{ update_id: 2 }]);
    await eventually(async () => handled().length === 2);
    expect(handled()[1][1]).toBe("2");
    expect(handled()[1][5]).toBe("1");
    expect(Number(handled()[1][3])).toBe(permanentPid);
    await command({ cmd: "stop_bot", token_id: ids[0] });
    await eventually(async () => events.some(event => event.l?.includes(`bot_stopped:${ids[0]}`)));
    batches.set(tokens[1], [{ update_id: 3 }]);
    await eventually(async () => handled().length === 3);
    expect(handled()[2][1]).toBe("3");
    await eventually(async () => workers.memoryCounters().workers[0].polling?.activeChildren === 0);
    await eventually(async () => { try { process.kill(permanentPid, 0); return false; } catch { return true; } });
    batches.set(tokens[1], [{ update_id: 4 }]);
    await eventually(async () => handled().length === 4, 30_000);
    expect(handled()[3][1]).toBe("4");
    expect(Number(handled()[3][3])).not.toBe(permanentPid);
    expect(await queues[0].offset()).toBeNull();
    await command({ cmd: "stop_bot", token_id: ids[1] });
  } finally {
    await workers.shutdown();
    await redis.del(...queues.flatMap(queue => queue.keys), state);
    redis.disconnect(); await telegram.close();
    if (!resolve(cacheDir).startsWith(resolve(tmpdir(), "tbb-unified-integration-"))) throw new Error("Небезопасный путь кеша");
    await rm(cacheDir, { recursive: true, force: true });
  }
}, 120_000);
