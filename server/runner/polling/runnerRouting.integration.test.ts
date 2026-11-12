/** @fileoverview Полный маршрут команд RunnerWorkers к Node polling и временному Python без Telegram. */
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

/** Предохранитель запрещает реальный Telegram даже при регрессии маршрутизации адреса API. */
vi.mock("./transport", async importOriginal => {
  const actual = await importOriginal<typeof import("./transport")>();
  return { ...actual, requestUpdates: (token: string, payload: object, signal: AbortSignal, apiBase?: string) => {
    if (!apiBase?.startsWith("http://127.0.0.1:")) throw new Error("Тест запрещает обращения к внешнему Telegram");
    return actual.requestUpdates(token, payload, signal, apiBase);
  } };
});

it("команда панели регистрирует DB token ID, получает очередь Telegram ID и не создаёт постоянный worker.py", async () => {
  const redisUrl = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6379";
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  const telegramId = randomInt(700_000_000_000, 800_000_000_000), databaseId = randomInt(100_000, 900_000);
  const token = `${telegramId}:isolated_fake_telegram_${telegramId}`;
  const queue = new DemandQueue(redis, telegramId);
  const wrongQueue = new DemandQueue(redis, databaseId);
  const state = `tbb:demand:{${telegramId}}:state:99002:${databaseId}`;
  const batches = new Map([[token, [] as { update_id: number }[]]]);
  const telegram = await fakeTelegram(batches);
  const cacheDir = await mkdtemp(join(tmpdir(), "tbb-node-routing-"));
  const events: RunnerEvent[] = [];
  const workers = new RunnerWorkers({ runnerId: "integration", redisUrl,
    pythonPath: resolve(process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python"),
    workerScript: resolve("server/python/worker.py"), cacheDir, buildsKeep: 1, requireFence: false,
    processPolling: "node" }, event => events.push(event));
  /** Передаёт ровно тот формат строк, который отправляет панель через поток Redis. */
  const command = (payload: object) => workers.handle({ k: "line", w: "99002", i: "routing-fixture", l: JSON.stringify(payload) });
  /** Читает агрегаты реальной логической группы без доступа к закрытым полям. */
  const counters = () => workers.memoryCounters().workers[0];
  try {
    await redis.ping();
    await workers.handle({ k: "spawn", w: "99002", i: "routing-fixture" });
    expect(counters().pid).toBeUndefined();
    await command({ cmd: "start_bot", token_id: databaseId, token,
      bot_file: resolve("server/runner/polling/fixtures/state_bot.py"), env: {
        BOT_POLLING_MODE: "process", BOT_ON_DEMAND_IDLE_SECONDS: "0.25", BOT_ON_DEMAND_MAX_ACTIVE: "2",
        REDIS_URL: redisUrl, TELEGRAM_BOT_API_URL: telegram.base,
      } });
    await eventually(async () => workers.snapshot().workers[0].tokenIds.includes(databaseId));
    expect(workers.snapshot().workers[0].tokenIds).not.toContain(telegramId);
    expect(counters().pid).toBeUndefined();
    expect(counters().polling?.activeChildren).toBe(0);
    expect(counters().polling?.children).toHaveLength(0);
    batches.set(token, [{ update_id: 10 }]);
    await eventually(async () => events.some(event => event.l?.includes("HANDLED=1")));
    await eventually(async () => counters().polling?.activeChildren === 0 && await queue.peek() === null);
    expect(await queue.offset()).toBe(11);
    expect(await wrongQueue.offset()).toBeNull();
    expect(await redis.get(state)).toContain("count");
    expect(counters().pid).toBeUndefined();
    expect(counters().legacy).toBeNull();
    expect(counters().polling?.children).toHaveLength(0);
    // Второе сообщение обязано восстановить снимок после полного завершения первого Python.
    batches.set(token, [{ update_id: 11 }]);
    await eventually(async () => events.some(event => event.l?.includes("HANDLED=2")));
    await eventually(async () => counters().polling?.activeChildren === 0 && await queue.peek() === null);
    expect(workers.snapshot().workers[0].tokenIds).toEqual([databaseId]);
    await command({ cmd: "stop_bot", token_id: databaseId });
    await eventually(async () => workers.snapshot().workers[0].tokenIds.length === 0);
    expect(events.some(event => event.l?.includes(`bot_started:${databaseId}`))).toBe(true);
    expect(events.some(event => event.l?.includes(`bot_started:${telegramId}`))).toBe(false);
  } finally {
    await workers.shutdown();
    await redis.del(...queue.keys, state);
    redis.disconnect(); await telegram.close();
    if (!resolve(cacheDir).startsWith(resolve(tmpdir(), "tbb-node-routing-"))) throw new Error("Небезопасный путь тестового кеша");
    await rm(cacheDir, { recursive: true, force: true });
  }
});
