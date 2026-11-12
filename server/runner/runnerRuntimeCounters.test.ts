/** @fileoverview Проверки приватности, ограничений, устаревания и поглощения служебной диагностики. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { RunnerRuntimeCounters } from "./runnerRuntimeCounters";

test("сохраняются только известные числовые поля, без секретов и исходных ссылок", () => {
  const counters = new RunnerRuntimeCounters();
  const frame = { type: "worker_runtime_counters", schemaVersion: 1, secret: "SECRET",
    bots: [{ tokenId: 42, secret: "SECRET", moduleCount: 2, rootTaskPending: 1,
      containers: { _user_var_locks: { count: 7, shallowBytes: 256, SECRET: "SECRET" }, SECRET: { count: 1 } },
      pools: { count: 1, size: 2, idle: 1, secret: "SECRET" } }] };
  assert.equal(counters.ingest(frame, 1000), true);
  frame.bots[0].containers._user_var_locks.count = 999;
  const sample = counters.snapshot(2000)!;
  assert.equal(sample.bots[0].containers._user_var_locks.count, 7);
  assert.equal(JSON.stringify(sample).includes("SECRET"), false);
  sample.bots[0].containers._user_var_locks.count = 888;
  assert.equal(counters.snapshot(2000)!.bots[0].containers._user_var_locks.count, 7);
});

test("пустой снимок и возраст различаются; повреждённый кадр поглощается без обновления времени", () => {
  const counters = new RunnerRuntimeCounters();
  assert.equal(counters.snapshot(), null);
  assert.equal(counters.ingest({ type: "stdout" }), false);
  assert.equal(counters.ingest({ type: "worker_runtime_counters", schemaVersion: 1, bots: [] }, 1000), true);
  assert.equal(counters.snapshot(31_000)!.stale, false);
  assert.equal(counters.snapshot(31_001)!.stale, true);
  assert.equal(counters.ingest({ type: "worker_runtime_counters", schemaVersion: 999 }, 40_000), true);
  assert.equal(counters.snapshot(40_000)!.receivedAt, 1000);
});

test("числа проверяются, строки ограничиваются, слишком большой кадр не заменяет снимок", () => {
  const counters = new RunnerRuntimeCounters();
  const frame = { type: "worker_runtime_counters", schemaVersion: 1, bots: Array.from({ length: 150 },
    (_, index) => ({ tokenId: index + 1, moduleCount: Infinity, rootTaskPending: "SECRET",
      containers: { user_data: { count: -1, shallowBytes: NaN } } })) };
  counters.ingest(frame, 1000);
  const sample = counters.snapshot(1000)!;
  assert.equal(sample.bots.length, 100);
  assert.equal(sample.botsTruncated, true);
  assert.deepEqual(sample.bots[0].containers.user_data, {});
  assert.equal(sample.bots[0].moduleCount, undefined);
  counters.ingest(frame, 2000, 262_145);
  assert.equal(counters.snapshot(2000)!.receivedAt, 1000);
});
