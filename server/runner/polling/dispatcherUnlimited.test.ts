/** @fileoverview Проверяет сто общих активаций без ограничения и сохранение предела отдельных процессов. */
import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { NodePollingDispatcher, type DispatcherCapacity, type DispatcherDependencies, type PollingBot } from "./dispatcher";

/** Создаёт регистрацию без секретов и реальных внешних подключений. */
function bot(tokenId: number): PollingBot {
  return { tokenId, token: "fixture", botFile: "fixture.py", env: {}, projectId: 1,
    idleTimeout: 30, workerKey: "test", instance: "test" };
}

/** Ожидает наблюдаемое состояние с конечным сроком вместо задержки простоя бота. */
async function until(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 3000;
  while (!predicate() && Date.now() < deadline) await delay(5);
  assert.ok(predicate(), "Диспетчер не достиг ожидаемого состояния");
}

/** Подменяет очередь и обработчики, оставляя настоящую конкурентную логику диспетчера. */
function fixture(capacity: DispatcherCapacity) {
  const pending = new Set<number>();
  const children = new Map<number, () => void>();
  const starts: number[] = [];
  const failures = new Map<number, () => void>();
  const dependencies: DispatcherDependencies = {
    hasPending: async item => pending.has(item.tokenId),
    receive: async (item, signal, _wake, ready) => {
      ready();
      await new Promise<void>((resolve, reject) => {
        failures.set(item.tokenId, () => reject(new Error("Блокировка потеряна")));
        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    },
    startChild: async item => {
      starts.push(item.tokenId);
      let finish!: () => void;
      const done = new Promise<void>(resolve => { finish = resolve; });
      children.set(item.tokenId, () => { children.delete(item.tokenId); finish(); });
      return { done, stop: async () => { children.get(item.tokenId)?.(); } };
    },
    lifecycle: () => {},
  };
  return { pending, children, starts, failures, dispatcher: new NodePollingDispatcher(dependencies, capacity) };
}

test("нулевой предел не блокирует запуск и означает отсутствие ограничения", async () => {
  const f = fixture(0);
  try {
    for (let id = 1; id <= 10; id++) { f.pending.add(id); await f.dispatcher.start(bot(id)); }
    await until(() => f.children.size === 10);
    assert.equal(f.dispatcher.counters().maximum, null);
  } finally { await f.dispatcher.shutdown(); }
});

test("сто общих сценариев одновременно работают, повторные сигналы не создают дубликаты", async () => {
  const f = fixture({ kind: "unlimited" });
  try {
    for (let id = 1; id <= 100; id++) { f.pending.add(id); await f.dispatcher.start(bot(id)); }
    await until(() => f.children.size === 100);
    assert.equal(f.dispatcher.counters().maximum, null);
    for (let repeat = 0; repeat < 10; repeat++) for (let id = 1; id <= 100; id++) f.dispatcher.wake(id);
    await delay(20);
    assert.equal(f.starts.length, 100);
    assert.equal(f.dispatcher.counters().waitingBots, 0);
    await f.dispatcher.stop(1);
    await until(() => f.children.size === 99);
    assert.ok(f.pending.has(1), "Остановка не удаляет сохранённое обновление");
    f.failures.get(2)!();
    await until(() => f.children.size === 98);
    assert.ok(f.children.has(100), "Потеря блокировки одного бота не прерывает соседей");
  } finally { await f.dispatcher.shutdown(); }
  assert.equal(f.children.size, 0);
});

test("сто пустых общих очередей не запускают обработчики", async () => {
  const f = fixture({ kind: "unlimited" });
  try {
    for (let id = 1; id <= 100; id++) await f.dispatcher.start(bot(id));
    await until(() => f.dispatcher.counters().waitingBots === 0);
    assert.equal(f.starts.length, 0);
    assert.equal(f.dispatcher.counters().activeChildren, 0);
  } finally { await f.dispatcher.shutdown(); }
});

test("отдельные процессы сохраняют предел четыре и запускают пятого только после выхода", async () => {
  const f = fixture(4);
  try {
    for (let id = 1; id <= 5; id++) { f.pending.add(id); await f.dispatcher.start(bot(id)); }
    await until(() => f.children.size === 4);
    assert.equal(f.dispatcher.counters().maximum, 4);
    assert.equal(f.dispatcher.counters().waitingBots, 1);
    assert.ok(!f.children.has(5));
    f.pending.delete(1);
    f.children.get(1)!();
    await until(() => f.children.has(5));
    assert.equal(f.children.size, 4);
  } finally { await f.dispatcher.shutdown(); }
});
