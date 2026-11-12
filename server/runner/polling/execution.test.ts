/** @fileoverview Проверяет виртуальную готовность и ленивый старый Python без Telegram и Redis. */
import { testPython } from "./testPython";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { RunnerWorkerExecution } from "../runnerWorkerExecution";
import type { RunnerConfig } from "../runnerConfig";
import type { RunnerEvent } from "../../redis/workerStreams";

/** Создаёт настройки без реальных адресов сервисов. */
function config(workerScript = "missing-worker.py"): RunnerConfig {
  return { runnerId: "fixture", redisUrl: "redis://unused", processPolling: "node", cacheDir: "unused", buildsKeep: 1,
    pythonPath: testPython(), workerScript };
}

/** Дожидается наблюдаемого события с конечным пределом вместо бессрочного зависания проверки. */
async function eventually(predicate: () => boolean): Promise<void> {
  const until = Date.now() + 5_000;
  while (!predicate()) { if (Date.now() >= until) throw new Error("Событие не получено"); await delay(10); }
}

test("пустая виртуальная группа готова без Python и завершается ровно один раз", async () => {
  const events: RunnerEvent[] = [];
  let gone = 0;
  const execution = new RunnerWorkerExecution(config(), { w: "0", i: "virtual" }, (event) => events.push(event), () => gone++);
  await delay(0);
  assert.equal(execution.pid, undefined);
  assert.equal(events.filter((event) => event.l?.includes("worker_ready")).length, 1);
  await execution.sendAsync('{"cmd":"status"}');
  execution.kill();
  await execution.shutdown();
  execution.kill();
  assert.equal(gone, 1);
  assert.equal(events.filter((event) => event.k === "exit").length, 1);
});

test("direct запускает старый Python лениво и не дублирует готовность логической группы", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tbb-legacy-route-"));
  const script = join(dir, "worker.py");
  await writeFile(script, `"""@fileoverview Поддельный воркер для проверки маршрута без сети."""
import json, sys
print(json.dumps({"type":"system","content":"worker_ready"}), flush=True)
for line in sys.stdin:
    command = json.loads(line)
    if command.get("cmd") == "shutdown":
        break
    print(json.dumps({"type":"stdout","content":command.get("cmd")}), flush=True)
`);
  const events: RunnerEvent[] = [];
  const execution = new RunnerWorkerExecution(config(script), { w: "0", i: "mixed" }, (event) => events.push(event), () => {});
  try {
    assert.equal(execution.pid, undefined);
    await execution.sendAsync(JSON.stringify({ cmd: "start_bot", token_id: 3, env: { BOT_POLLING_MODE: "direct" } }));
    await eventually(() => events.some((event) => event.l?.includes("start_bot")));
    assert.ok(execution.pid);
    assert.equal(events.filter((event) => event.l?.includes("worker_ready")).length, 1);
    await execution.shutdown();
    assert.equal(events.filter((event) => event.k === "exit").length, 1);
  } finally {
    execution.kill();
    if (!resolve(dir).startsWith(resolve(tmpdir(), "tbb-legacy-route-"))) throw new Error("Небезопасный путь фикстуры");
    await rm(dir, { recursive: true, force: true });
  }
});
