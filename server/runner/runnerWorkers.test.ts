/**
 * @fileoverview Тесты воркеров исполнителя на поддельном worker.py (скрипт Node)
 * @module server/runner/runnerWorkers.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunnerEvent } from "../redis/workerStreams";
import { packBotBuild } from "../bots/builds/botBuildCodec";
import { RunnerWorkers } from "./runnerWorkers";

/** Поддельный воркер: сообщает о готовности, отвечает на строки, выходит по shutdown */
const FAKE_WORKER = `
const rl = require("node:readline").createInterface({ input: process.stdin });
console.log(JSON.stringify({ type: "system", content: "worker_ready:" + process.env.PROJECT_ID }));
rl.on("line", (line) => {
  if (JSON.parse(line).cmd === "shutdown") process.exit(0);
  console.log(JSON.stringify({ type: "stdout", token_id: 1, content: line }));
});
`;

/**
 * Создаёт исполнителя с поддельным воркером
 * @returns воркеры и собранные события
 */
function makeWorkers(fetchBuild?: (url: string) => Promise<Buffer>): {
  workers: RunnerWorkers;
  events: RunnerEvent[];
  next: (k: string) => Promise<RunnerEvent>;
  cacheDir: string;
} {
  const dir = mkdtempSync(join(tmpdir(), "runner-"));
  const script = join(dir, "worker.cjs");
  writeFileSync(script, FAKE_WORKER);
  // Исполнитель вызывает `<python> -u worker.py`; обёртка отбрасывает -u и запускает Node
  const python = join(dir, "fake-python");
  writeFileSync(python, `#!/bin/sh\nshift\nexec "${process.execPath}" "$@"\n`);
  chmodSync(python, 0o755);
  const events: RunnerEvent[] = [];
  const waiters: Array<() => void> = [];
  const workers = new RunnerWorkers(
    { runnerId: "t", redisUrl: "redis://unused", pythonPath: python, workerScript: script, cacheDir: join(dir, "cache"), buildsKeep: 5 },
    (event) => {
      events.push(event);
      waiters.splice(0).forEach((w) => w());
    },
    fetchBuild,
  );
  const next = async (k: string): Promise<RunnerEvent> => {
    for (;;) {
      const found = events.find((e) => e.k === k);
      if (found) {
        events.splice(events.indexOf(found), 1);
        return found;
      }
      await new Promise<void>((resolve) => waiters.push(resolve));
    }
  };
  return { workers, events, next, cacheDir: join(dir, "cache") };
}

describe("RunnerWorkers", () => {
  it("запускает воркер, пересылает строки в обе стороны и штатно останавливает", async () => {
    const { workers, next } = makeWorkers();
    workers.handle({ k: "spawn", w: "5", i: "a" });
    assert.match((await next("line")).l ?? "", /worker_ready:5/);
    workers.handle({ k: "line", w: "5", i: "a", l: '{"cmd":"status"}' });
    assert.match((await next("line")).l ?? "", /status/);
    await workers.shutdown();
    const exit = await next("exit");
    assert.deepStrictEqual([exit.i, exit.c], ["a", "0"]);
    assert.strictEqual(workers.size, 0);
  });

  it("строки для старого экземпляра не доходят до нового, spawn убивает старый", async () => {
    const { workers, next } = makeWorkers();
    workers.handle({ k: "spawn", w: "5", i: "old" });
    await next("line");
    workers.handle({ k: "spawn", w: "5", i: "new" });
    const oldExit = await next("exit");
    assert.deepStrictEqual([oldExit.i, oldExit.s], ["old", "SIGKILL"]);
    await next("line");
    workers.handle({ k: "line", w: "5", i: "old", l: '{"cmd":"x"}' });
    workers.handle({ k: "reset" });
    const newExit = await next("exit");
    assert.strictEqual(newExit.i, "new");
    assert.strictEqual(workers.size, 0);
  });

  it("kill неизвестного экземпляра сразу отвечает exit", async () => {
    const { workers, next } = makeWorkers();
    workers.handle({ k: "kill", w: "9", i: "gone" });
    assert.deepStrictEqual(await next("exit"), { w: "9", i: "gone", k: "exit", s: "SIGKILL" });
  });

  it("start_bot со сборкой: код скачан, bot_file подменён, следующая команда не обгоняет", async () => {
    const packed = packBotBuild(Buffer.from("x = 1\n"));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { workers, next, cacheDir } = makeWorkers(async () => {
      await gate;
      return packed.data;
    });
    const fingerprint = "cd".repeat(16);
    const build = { url: "https://s3/b", sha256: packed.sha256, size: packed.size, fingerprint, file_name: "bot.py" };
    workers.handle({ k: "spawn", w: "5", i: "a" });
    await next("line");
    workers.handle({ k: "line", w: "5", i: "a", l: JSON.stringify({ cmd: "start_bot", token_id: 1, bot_file: "/panel/x.py", build }) });
    workers.handle({ k: "line", w: "5", i: "a", l: '{"cmd":"stop_bot","token_id":1}' });
    release();
    const started = JSON.parse(JSON.parse((await next("line")).l!).content);
    assert.deepStrictEqual([started.cmd, started.bot_file, started.build], ["start_bot", join(cacheDir, fingerprint, "bot.py"), undefined]);
    assert.strictEqual(JSON.parse(JSON.parse((await next("line")).l!).content).cmd, "stop_bot");
    await workers.shutdown();
  });

  it("сборка не скачалась — панель получает ошибку бота и bot_exited", async () => {
    const { workers, next } = makeWorkers(async () => {
      throw new Error("HTTP 403 при скачивании сборки");
    });
    const build = { url: "https://s3/b", sha256: "0".repeat(64), size: 1, fingerprint: "ef".repeat(16), file_name: "bot.py" };
    workers.handle({ k: "spawn", w: "5", i: "a" });
    await next("line");
    workers.handle({ k: "line", w: "5", i: "a", l: JSON.stringify({ cmd: "start_bot", token_id: 4, build }) });
    const log = JSON.parse((await next("line")).l!);
    assert.deepStrictEqual([log.type, log.token_id], ["stderr", 4]);
    assert.match(log.content, /HTTP 403/);
    assert.deepStrictEqual(JSON.parse((await next("line")).l!), { type: "system", content: "bot_exited:4:error" });
    await workers.shutdown();
  });
});
