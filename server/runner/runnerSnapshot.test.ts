/** @fileoverview Проверяет безопасный снимок фактической конфигурации и общего RSS Node. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { RunnerWorkers } from "./runnerWorkers";

test("снимок пустого исполнителя показывает реальную конфигурацию без секретов", () => {
  const workers = new RunnerWorkers({ runnerId: "safe", redisUrl: "redis://secret-unused",
    pythonPath: "python", workerScript: "unused", cacheDir: "unused", buildsKeep: 1,
    processPolling: "node" }, () => {});
  const snapshot = workers.snapshot();
  assert.deepEqual(snapshot.workers, []);
  assert.equal(snapshot.runtime?.processPolling, "node");
  assert.equal(snapshot.runtime?.processHandler, "shared");
  assert.equal(snapshot.runtime?.pid, process.pid);
  assert.ok(snapshot.runtime!.nodeRssBytes > 0);
  assert.ok(snapshot.runtime!.uptimeSeconds >= 0);
  assert.equal(JSON.stringify(snapshot).includes("secret-unused"), false);
});
