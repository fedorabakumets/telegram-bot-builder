/** @fileoverview Проверка сохранения POSIX-сигнала настоящего Python под сторожем дерева. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

/** Запускает реальный сторож, оставляя stdin открытым до завершения дочернего Python. */
async function guardedExit(source: string): Promise<{ code: number | null; signal: string | null }> {
  const directory = await mkdtemp(join(tmpdir(), "tbb-guard-signal-"));
  const target = join(directory, "target.py");
  await writeFile(target, source);
  try {
    const child = spawn(process.env.TEST_PYTHON ?? "python3", ["-u", resolve("server/python/process_child_guard.py"), target],
      { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    const timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
    try {
      return await new Promise((resolveExit, reject) => {
        child.once("error", reject);
        child.once("exit", (code, signal) => {
          if (stderr) reject(new Error(stderr));
          else resolveExit({ code, signal });
        });
      });
    } finally { clearTimeout(timer); child.stdin.destroy(); }
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test("сторож сохраняет SIGTERM дочернего Python вместо кодировки отрицательного статуса", {
  skip: process.platform === "win32", timeout: 25_000,
}, async () => {
  assert.deepEqual(await guardedExit("import os, signal\nos.kill(os.getpid(), signal.SIGTERM)\n"), { code: null, signal: "SIGTERM" });
});

test("сторож сохраняет SIGKILL и обычный ненулевой код дочернего Python", {
  skip: process.platform === "win32", timeout: 40_000,
}, async () => {
  assert.deepEqual(await guardedExit("import os, signal\nos.kill(os.getpid(), signal.SIGKILL)\n"), { code: null, signal: "SIGKILL" });
  assert.deepEqual(await guardedExit("import sys\nsys.exit(7)\n"), { code: 7, signal: null });
});
