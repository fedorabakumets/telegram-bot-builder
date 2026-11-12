/** @fileoverview Проверки отключения диагностики и учёта незавершённых отправок без удержания событий. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createEventMemoryTracker, memoryInterval, redisQueueLength, startRunnerMemoryMonitor } from "./runnerMemoryMonitor";

test("Диагностика отключена по умолчанию и ограничивает частоту снимков", () => {
  for (const value of [undefined, "", "0", "-1", "NaN", "Infinity"]) assert.equal(memoryInterval(value), 0);
  assert.equal(memoryInterval("1"), 5000);
  assert.equal(memoryInterval("30000"), 30000);
  const stop = startRunnerMemoryMonitor({ counters: () => { throw new Error("не должен вызываться"); } });
  stop();
});

test("Счётчики освобождаются после успеха, отказа и синхронной ошибки", async () => {
  const tracker = createEventMemoryTracker();
  const event = { k: "line" as const, w: "1", i: "x", l: "привет" };
  let finish!: () => void;
  const sent = tracker.send(event, () => new Promise<void>((resolve) => { finish = resolve; }));
  assert.equal(tracker.snapshot().pendingCount, 1);
  assert.equal(tracker.snapshot().pendingJsonBytes, Buffer.byteLength(JSON.stringify(event)));
  finish(); await sent;
  await assert.rejects(tracker.send(event, async () => { throw new Error("Redis недоступен"); }));
  await assert.rejects(tracker.send(event, () => { throw new Error("отказ отправки"); }));
  assert.equal(tracker.snapshot().pendingCount, 0);
  assert.equal(tracker.snapshot().pendingJsonBytes, 0);
  assert.equal(tracker.snapshot().peakJsonBytes, Buffer.byteLength(JSON.stringify(event)));
});

test("Отсутствующие внутренние очереди Redis не выдаются за пустые", () => {
  assert.equal(redisQueueLength({}, "offlineQueue"), null);
  assert.equal(redisQueueLength({ commandQueue: { length: 3 } }, "commandQueue"), 3);
  assert.equal(redisQueueLength({ offlineQueue: { length: "секрет" } }, "offlineQueue"), null);
});

test("Включённый монитор выдаёт снимок процесса и прекращает сбор по stop", async () => {
  let stop: () => void = () => undefined;
  const snapshot = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const timeout = setTimeout(() => { stop(); reject(new Error("снимок не получен")); }, 10000);
    stop = startRunnerMemoryMonitor({ intervalMs: "30000", counters: () => ({ testCounter: 7 }),
      log: (value) => { clearTimeout(timeout); stop(); resolve(value as Record<string, unknown>); } });
  });
  assert.equal(snapshot.type, "runner_memory");
  assert.equal(snapshot.pid, process.pid);
  assert.deepEqual(snapshot.counters, { testCounter: 7 });
  assert.ok((snapshot.node as NodeJS.MemoryUsage).rss > 0);
});
