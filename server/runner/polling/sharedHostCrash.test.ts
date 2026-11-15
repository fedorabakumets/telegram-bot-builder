/** @fileoverview Адресные проверки числовой диагностики аварии без ложного вывода об OOM. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isChildHostCrashLine, reportSharedHostCrash, sharedHostMemory } from "./sharedHostCrash";

test("снимок использует только числовые показатели фиксированных файлов", () => {
  const files: Record<string, string> = { "memory.current": "123\n", "memory.max": "350000000\n", "memory.events": "oom 0\noom_kill 2\n" };
  const snapshot = sharedHostMemory(path => files[path.replace("/sys/fs/cgroup/", "")]);
  assert.deepEqual(snapshot, { memoryCurrentBytes: 123, memoryMaxBytes: 350000000, oomKillCount: 2 });
});

test("недоступная cgroup и безлимитная память остаются неизвестными", () => {
  assert.deepEqual(sharedHostMemory(() => { throw new Error("unavailable"); }), {
    memoryCurrentBytes: undefined, memoryMaxBytes: undefined, oomKillCount: undefined,
  });
  assert.equal(sharedHostMemory(() => "max").memoryMaxBytes, undefined);
});

test("авария содержит исходный код и сигнал, не объявляет любой SIGKILL нехваткой памяти", () => {
  const events: Record<string, unknown>[] = [];
  reportSharedHostCrash(event => events.push(event), [5, 11, 5], { code: null, signal: "SIGKILL" }, 42, {});
  assert.equal(events.length, 2);
  assert.deepEqual(events.map(event => event.token_id), [5, 11]);
  assert.ok(events.every(event => event.exit_code === null && event.signal === "SIGKILL" && event.pid === 42));
  assert.ok(events.every(event => !("oomKilled" in event)));
  const cleanExit: Record<string, unknown>[] = [];
  reportSharedHostCrash(event => cleanExit.push(event), [5], { code: 0, signal: null }, 42, {});
  assert.equal(cleanExit[0].exit_code, 0);
});

test("OOM-дельта привязана к жизни хоста, сброс счётчика не превращается в отрицательную дельту", () => {
  const events: Record<string, unknown>[] = [];
  const emit = (event: Record<string, unknown>) => events.push(event);
  reportSharedHostCrash(emit, [5], { code: null, signal: "SIGKILL" }, 42, { oomKillCount: 3 }, { oomKillCount: 5 });
  assert.deepEqual(events[0].diagnostics, { oomKillCount: 5, oomKillDelta: 2 });
  reportSharedHostCrash(emit, [5], { code: 7, signal: null }, 42, { oomKillCount: 3 }, { oomKillCount: 0 });
  assert.deepEqual(events[1].diagnostics, { oomKillCount: 0 });
});

test("поддельная причина от старого дочернего процесса не проходит доверенную границу", () => {
  assert.equal(isChildHostCrashLine(JSON.stringify({ type: "worker_host_crash", token_id: 999 })), true);
  assert.equal(isChildHostCrashLine(JSON.stringify({ type: "stderr", content: "worker_host_crash" })), false);
  assert.equal(isChildHostCrashLine("ordinary output"), false);
});
