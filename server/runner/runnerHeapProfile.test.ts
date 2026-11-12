/** @fileoverview Адресные проверки выборочного профиля V8, остановки и сводки мест выделений. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { url, type HeapProfiler } from "node:inspector";
import { heapProfileSettings, startRunnerHeapProfile } from "./runnerHeapProfile";
import { summarizeHeapProfile } from "./runnerHeapProfileReport";

test("Настройки отключены по умолчанию и ограничивают длительность и частоту выборки", async () => {
  assert.equal(heapProfileSettings({}).enabled, false);
  assert.equal(heapProfileSettings({}).durationMs, 60000);
  const settings = heapProfileSettings({ RUNNER_HEAP_PROFILE: "TRUE", RUNNER_HEAP_PROFILE_SECONDS: "Infinity",
    RUNNER_HEAP_PROFILE_INTERVAL_BYTES: "1" });
  assert.equal(settings.enabled, true);
  assert.equal(settings.durationMs, 60000);
  assert.equal(settings.samplingInterval, 16384);
  assert.equal(heapProfileSettings({ RUNNER_HEAP_PROFILE_SECONDS: "1000" }).durationMs, 300000);
  const stop = await startRunnerHeapProfile({}, () => assert.fail("выключенный профиль не должен писать сообщения"));
  await stop();
});

/** Создаёт узел тестового профиля с координатами V8, отсчитываемыми от нуля. */
function node(size: number, children: HeapProfiler.SamplingHeapProfileNode[] = []): HeapProfiler.SamplingHeapProfileNode {
  return { selfSize: size, children, callFrame: { functionName: "allocate", scriptId: "1",
    url: "file:///runner.js", lineNumber: 2, columnNumber: 3 } };
}

test("Сводка объединяет одинаковые функции без повторного сложения родительского объёма", () => {
  const summary = summarizeHeapProfile({ head: node(10, [node(20), node(30)]) });
  assert.equal(summary.sampledBytes, 60);
  assert.equal(summary.topAllocations.length, 1);
  assert.deepEqual(summary.topAllocations[0], { functionName: "allocate", file: "file:///runner.js",
    line: 3, column: 4, sampledBytes: 60 });
});

test("Реальный V8 сохраняет читаемый профиль один раз и не открывает порт", async () => {
  const directory = await mkdtemp(join(tmpdir(), "runner-heap-"));
  const messages: Array<Record<string, unknown>> = [];
  const debuggerUrl = url();
  let stop: () => Promise<void> = async () => undefined;
  try {
    stop = await startRunnerHeapProfile({ RUNNER_HEAP_PROFILE: "true", RUNNER_HEAP_PROFILE_SECONDS: "30",
      RUNNER_HEAP_PROFILE_DIR: directory, RUNNER_HEAP_PROFILE_INTERVAL_BYTES: "16384" },
    (message) => messages.push(message as Record<string, unknown>));
    /** Удерживает выделения до конца выборки, не добавляя их содержимое в профиль. */
    const retained = Array.from({ length: 100000 }, (_, index) => ({ index, value: `PRIVATE_VALUE_${index}` }));
    await Promise.all([stop(), stop()]);
    assert.equal(retained.length, 100000);
    assert.equal(url(), debuggerUrl);
    const files = await readdir(directory);
    assert.equal(files.length, 1);
    assert.match(files[0], /^runner-\d+-\d+\.heapprofile$/);
    const contents = await readFile(join(directory, files[0]), "utf8");
    const profile = JSON.parse(contents);
    assert.ok(profile.head.callFrame);
    assert.ok(summarizeHeapProfile(profile).sampledBytes > 0);
    assert.equal(contents.includes("PRIVATE_VALUE_"), false);
    assert.equal(messages.filter((message) => message.type === "runner_heap_profile").length, 1);
    assert.equal(messages[1].file, join(directory, files[0]));
  } finally { await stop(); await rm(directory, { recursive: true, force: true }); }
});

test("Таймер автоматически заканчивает сеанс и повторная остановка не создаёт файл", async () => {
  const directory = await mkdtemp(join(tmpdir(), "runner-heap-timer-"));
  let stop: () => Promise<void> = async () => undefined;
  let notify!: () => void;
  const completed = new Promise<void>((resolve) => { notify = resolve; });
  const timeout = setTimeout(() => notify(), 10000);
  try {
    stop = await startRunnerHeapProfile({ RUNNER_HEAP_PROFILE: "true", RUNNER_HEAP_PROFILE_SECONDS: "1",
      RUNNER_HEAP_PROFILE_DIR: directory }, (message) => {
      if ((message as { type: string }).type === "runner_heap_profile") notify();
    });
    await completed;
    assert.equal((await readdir(directory)).length, 1);
    await stop();
    assert.equal((await readdir(directory)).length, 1);
  } finally { clearTimeout(timeout); await stop(); await rm(directory, { recursive: true, force: true }); }
});

test("Недоступный каталог профиля не прерывает запуск исполнителя", async () => {
  const directory = await mkdtemp(join(tmpdir(), "runner-heap-error-"));
  try {
    const file = join(directory, "existing-file");
    await writeFile(file, "занято");
    const stop = await startRunnerHeapProfile({ RUNNER_HEAP_PROFILE: "true", RUNNER_HEAP_PROFILE_DIR: file });
    await stop();
    assert.deepEqual(await readdir(directory), ["existing-file"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
