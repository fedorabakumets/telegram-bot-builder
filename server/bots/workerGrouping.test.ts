/**
 * @fileoverview Тесты режимов группировки воркеров (WORKER_GROUPING)
 * @module server/bots/workerGrouping.test
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { getWorkerGroupingMode, resolveWorkerKey, SHARED_WORKER_KEY } from "./workerGrouping";

describe("workerGrouping", () => {
  const initial = process.env.WORKER_GROUPING;
  beforeEach(() => {
    delete process.env.WORKER_GROUPING;
  });
  afterEach(() => {
    if (initial === undefined) delete process.env.WORKER_GROUPING;
    else process.env.WORKER_GROUPING = initial;
  });

  it("по умолчанию и при неизвестном значении — воркер на проект", () => {
    assert.strictEqual(getWorkerGroupingMode(), "project");
    assert.strictEqual(resolveWorkerKey(42, 7), 42);
    process.env.WORKER_GROUPING = "что-то";
    assert.strictEqual(getWorkerGroupingMode(), "project");
  });

  it("shared — один ключ для всех проектов", () => {
    process.env.WORKER_GROUPING = "shared";
    assert.strictEqual(resolveWorkerKey(1, 7), SHARED_WORKER_KEY);
    assert.strictEqual(resolveWorkerKey(2, 8), SHARED_WORKER_KEY);
  });

  it("owner — ключ владельца, проекты одного владельца вместе", () => {
    process.env.WORKER_GROUPING = " Owner ";
    assert.strictEqual(getWorkerGroupingMode(), "owner");
    assert.strictEqual(resolveWorkerKey(1, 1612141295), 1612141295);
    assert.strictEqual(resolveWorkerKey(2, 1612141295), 1612141295);
    assert.strictEqual(resolveWorkerKey(3, 99), 99);
  });

  it("owner без владельца — отдельный отрицательный ключ, не пересекается с ID пользователей", () => {
    process.env.WORKER_GROUPING = "owner";
    assert.strictEqual(resolveWorkerKey(5, null), -5);
    assert.strictEqual(resolveWorkerKey(5), -5);
    assert.notStrictEqual(resolveWorkerKey(5, null), resolveWorkerKey(6, 5));
  });
});
