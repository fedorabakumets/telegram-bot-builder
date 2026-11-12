/** @fileoverview Проверяет снятие защитных отметок и объединение очисток кеша при параллельных стартах. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { RunnerBuildPins } from "./runnerBuildPins";
import { RunnerCachePruner } from "./runnerCachePruner";

test("сборка зарегистрированного ondemand удерживается до окончательной остановки", () => {
  const pins = new RunnerBuildPins();
  pins.prepare(1, "old");
  pins.started(1);
  assert.deepEqual(pins.values(), ["old"]);
  // Временный сон не выдаёт bot_stopped и не меняет регистрацию.
  assert.equal(pins.size, 1);
  pins.stopped(1);
  assert.deepEqual(pins.values(), []);
});

test("старый stop не снимает новую сборку ожидающего перезапуска", () => {
  const pins = new RunnerBuildPins();
  pins.prepare(1, "old");
  pins.started(1);
  pins.prepare(1, "new");
  assert.deepEqual(pins.values(), ["old", "new"]);
  pins.stopped(1);
  pins.stopped(1);
  assert.deepEqual(pins.values(), ["new"]);
  pins.started(1);
  assert.deepEqual(pins.values(), ["new"]);
  pins.stopped(1);
  assert.equal(pins.size, 0);
});

test("неуспешный первоначальный запуск снимает подготовленную сборку", () => {
  const pins = new RunnerBuildPins();
  pins.prepare(1, "bad");
  pins.stopped(1, true);
  assert.equal(pins.size, 0);
});

test("два быстрых запуска подтверждаются по порядку и защищают обе версии", () => {
  const pins = new RunnerBuildPins();
  pins.prepare(1, "first");
  pins.prepare(1, "second");
  pins.started(1);
  assert.deepEqual(pins.values(), ["first", "second"]);
  pins.stopped(1);
  assert.deepEqual(pins.values(), ["second"]);
  pins.started(1);
  assert.deepEqual(pins.values(), ["second"]);
  pins.stopped(1);
  assert.equal(pins.size, 0);
});

test("параллельные подготовки объединяются в одну очистку после завершения обеих", async () => {
  let scans = 0;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  const pruner = new RunnerCachePruner(async () => { scans++; }, 5);
  const starts = [pruner.protect(async () => gate), pruner.protect(async () => gate)];
  pruner.request();
  await delay(20);
  assert.equal(scans, 0);
  finish();
  await Promise.all(starts);
  await delay(20);
  assert.equal(scans, 1);
  pruner.cancel();
});

test("подготовка ждёт завершения удаления и очистки не выполняются параллельно", async () => {
  let release!: () => void;
  let scans = 0;
  let active = 0;
  let entered = false;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const pruner = new RunnerCachePruner(async () => {
    assert.equal(active++, 0);
    scans++;
    await gate;
    active--;
  }, 1);
  pruner.request();
  await delay(10);
  assert.equal(scans, 1);
  const start = pruner.protect(async () => { entered = true; });
  pruner.request();
  await delay(10);
  assert.equal(entered, false);
  release();
  await start;
  assert.equal(entered, true);
  pruner.cancel();
});
