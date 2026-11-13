/** @fileoverview Проверяет конкурентные команды жизненного цикла без внешних подключений. */
import test from "node:test";
import assert from "node:assert/strict";
import { NodePollingDispatcher, type PollingBot } from "./dispatcher";

/** Создаёт приёмники с наблюдаемым освобождением ресурсов. */
function fixture() {
  const receivers = new Set<AbortSignal>();
  let children = 0;
  const states: string[] = [];
  const dispatcher = new NodePollingDispatcher({
    hasPending: async () => true,
    receive: async (_bot, signal, _wake, ready) => {
      receivers.add(signal);
      ready();
      await new Promise<void>(resolve => {
        if (signal.aborted) resolve();
        else signal.addEventListener("abort", () => resolve(), { once: true });
      });
      receivers.delete(signal);
    },
    startChild: async () => {
      children++;
      let finish!: () => void;
      const done = new Promise<void>(resolve => { finish = resolve; });
      let stopped = false;
      return { done, stop: async () => { if (!stopped) { stopped = true; children--; finish(); } } };
    },
    lifecycle: (_bot, state) => { states.push(state); },
  });
  const bot: PollingBot = { tokenId: 1, token: "fake", botFile: "fake.py", env: {},
    idleTimeout: 30, projectId: 1, workerKey: "1", instance: "test" };
  return { dispatcher, bot, receivers, states, childCount: () => children };
}

test("два одновременных запуска оставляют ровно один приёмник и очищаются при остановке", async () => {
  const f = fixture();
  try {
    await Promise.all([f.dispatcher.start(f.bot), f.dispatcher.start(f.bot)]);
    assert.equal(f.receivers.size, 1);
    await f.dispatcher.stop(1);
    assert.equal(f.receivers.size, 0);
    assert.equal(f.childCount(), 0);
    assert.equal(f.dispatcher.counters().registeredBots, 0);
  } finally { await f.dispatcher.shutdown(); }
});

test("замена регистрации не публикует stop прежнего запуска, явная остановка публикует", async () => {
  const f = fixture();
  try {
    await f.dispatcher.start(f.bot);
    await f.dispatcher.start(f.bot);
    assert.deepEqual(f.states, ["started", "started"]);
    await f.dispatcher.stopForHandoff(1);
    assert.deepEqual(f.states, ["started", "started"]);
    await f.dispatcher.start(f.bot);
    await f.dispatcher.stop(1);
    assert.deepEqual(f.states, ["started", "started", "started", "stopped"]);
  } finally { await f.dispatcher.shutdown(); }
});

test("остановка сразу после запуска не пропускает ещё не зарегистрированный приёмник", async () => {
  const f = fixture();
  try {
    await Promise.all([f.dispatcher.start(f.bot), f.dispatcher.stop(1)]);
    assert.equal(f.receivers.size, 0);
    assert.equal(f.childCount(), 0);
    assert.equal(f.dispatcher.counters().registeredBots, 0);
  } finally { await f.dispatcher.shutdown(); }
});

test("выключение во время команды запуска дожидается очистки её приёмника и процесса", async () => {
  const f = fixture();
  try {
    await Promise.all([f.dispatcher.start(f.bot), f.dispatcher.shutdown()]);
    assert.equal(f.receivers.size, 0);
    assert.equal(f.childCount(), 0);
    assert.equal(f.dispatcher.counters().registeredBots, 0);
  } finally { await f.dispatcher.shutdown(); }
});
