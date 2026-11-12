/** @fileoverview Проверяет предел процессов, гонки пробуждения и сохранение очереди после остановки. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { NodePollingDispatcher, type DispatcherDependencies, type PollingBot } from "./dispatcher";

/** Создаёт несекретную регистрацию для проверки диспетчера. */
function bot(tokenId: number): PollingBot {
  return { tokenId, token: "fake", botFile: "test.py", env: {}, projectId: 1,
    idleTimeout: 30, workerKey: "1", instance: "fake" };
}

/** Даёт асинхронным адаптерам закончить текущие операции без ожидания таймеров простоя. */
async function settle(): Promise<void> { await delay(20); }

/** Создаёт управляемую очередь и процессы, не обращаясь к Telegram и Redis. */
function fixture(maxActive = 4) {
  const pending = new Set<number>();
  const children = new Map<number, () => void>();
  const starts: number[] = [];
  const states: string[] = [];
  const dependencies: DispatcherDependencies = {
    hasPending: async (item) => pending.has(item.tokenId),
    receive: async (_item, signal, _wake, ready) => {
      ready();
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
    },
    startChild: async (item) => {
      starts.push(item.tokenId);
      let finish!: () => void;
      const done = new Promise<void>((resolve) => { finish = resolve; });
      children.set(item.tokenId, () => { children.delete(item.tokenId); finish(); });
      return { done, stop: async () => { children.get(item.tokenId)?.(); } };
    },
    lifecycle: (item, state) => { states.push(`${item.tokenId}:${state}`); },
  };
  return { pending, children, starts, states, dependencies,
    dispatcher: new NodePollingDispatcher(dependencies, maxActive) };
}

test("пустые очереди не запускают Python; повторы пробуждения объединяются", async () => {
  const f = fixture();
  await f.dispatcher.start(bot(1));
  await settle();
  assert.equal(f.starts.length, 0);
  assert.deepEqual(f.dispatcher.counters().bots, [{ tokenId: 1, activity: "sleeping" }]);
  f.pending.add(1);
  for (let count = 0; count < 20; count++) f.dispatcher.wake(1);
  await settle();
  assert.deepEqual(f.starts, [1]);
  assert.deepEqual(f.dispatcher.counters().bots, [{ tokenId: 1, activity: "active" }]);
  f.pending.delete(1);
  f.children.get(1)?.();
  await settle();
  assert.equal(f.dispatcher.counters().activeChildren, 0);
  await f.dispatcher.shutdown();
  assert.deepEqual(f.dispatcher.counters().bots, []);
});

test("пятый бот ждёт выхода процесса; очередь не теряется при остановке", async () => {
  const f = fixture();
  for (let id = 1; id <= 5; id++) { f.pending.add(id); await f.dispatcher.start(bot(id)); }
  await settle();
  assert.equal(f.children.size, 4);
  assert.equal(f.dispatcher.counters().activeChildren, 4);
  assert.deepEqual(f.dispatcher.counters().bots.find((item) => item.tokenId === 5), { tokenId: 5, activity: "waiting" });
  f.pending.delete(1);
  f.children.get(1)?.();
  await settle();
  assert.ok(f.starts.includes(5));
  await f.dispatcher.stop(5);
  assert.ok(f.pending.has(5));
  await f.dispatcher.shutdown();
  assert.equal(f.children.size, 0);
  assert.equal(f.dispatcher.counters().registeredBots, 0);
});

test("обновление во время выхода обработчика запускает следующую проверку", async () => {
  const f = fixture(1);
  f.pending.add(1);
  await f.dispatcher.start(bot(1));
  await settle();
  f.children.get(1)?.();
  f.dispatcher.wake(1);
  await settle();
  assert.deepEqual(f.starts, [1, 1]);
  await f.dispatcher.shutdown();
});

test("потеря приёмника завершает обработчик и сообщает ошибку регистрации", async () => {
  const f = fixture();
  let fail!: () => void;
  f.dependencies.receive = async (_item, _signal, _wake, ready) => {
    ready();
    await new Promise<void>((_resolve, reject) => { fail = () => reject(new Error("lease lost")); });
  };
  f.pending.add(1);
  await f.dispatcher.start(bot(1));
  await settle();
  fail();
  await settle();
  assert.deepEqual(f.states, ["1:started", "1:error"]);
  assert.equal(f.children.size, 0);
  assert.equal(f.dispatcher.counters().registeredBots, 0);
});

test("остановка во время запуска отменяет дочерний процесс до завершения регистрации", async () => {
  const f = fixture();
  let starting!: () => void;
  const started = new Promise<void>((resolve) => { starting = resolve; });
  f.dependencies.startChild = async (_item, signal) => {
    starting();
    await new Promise<void>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("отменено")), { once: true });
    });
    throw new Error("Недостижимый запуск");
  };
  f.pending.add(1);
  await f.dispatcher.start(bot(1));
  await started;
  await f.dispatcher.stop(1);
  assert.equal(f.dispatcher.counters().activeChildren, 0);
  assert.deepEqual(f.states, ["1:started", "1:stopped"]);
  assert.ok(f.pending.has(1));
});

test("непрерывная очередь первого бота не вытесняет ожидающего второго", async () => {
  const f = fixture(1);
  f.pending.add(1);
  f.pending.add(2);
  await f.dispatcher.start(bot(1));
  await f.dispatcher.start(bot(2));
  await settle();
  assert.deepEqual(f.starts, [1]);
  f.children.get(1)?.();
  await settle();
  assert.deepEqual(f.starts, [1, 2]);
  await f.dispatcher.shutdown();
});
