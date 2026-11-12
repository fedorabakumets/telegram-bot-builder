/** @fileoverview Проверяет порядок завершения обработчика и освобождения общей polling-блокировки. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NodePollingDispatcher, type PollingBot } from "./dispatcher";
import { withPollingLease } from "./lease";

test("блокировка снимается только после выхода процесса без взаимного ожидания приёмника", async () => {
  const order: string[] = [];
  let failReceiver!: () => void;
  let started!: () => void;
  const childStarted = new Promise<void>((resolve) => { started = resolve; });
  const bot: PollingBot = { tokenId: 1, token: "fake", botFile: "fake.py", env: {},
    idleTimeout: 30, projectId: 1, workerKey: "1", instance: "1" };
  const redis = {
    set: async () => "OK",
    eval: async () => { order.push("lease_released"); return 1; },
  } as unknown as Parameters<typeof withPollingLease>[0];
  let dispatcher!: NodePollingDispatcher;
  dispatcher = new NodePollingDispatcher({
    hasPending: async () => true,
    receive: async (_bot, signal, _wake, ready) => withPollingLease(redis, bot.token, signal,
      async () => {
        ready();
        await new Promise<void>((_resolve, reject) => {
          failReceiver = () => reject(new Error("receiver failed"));
        });
      }, () => dispatcher.quiesceChild(bot.tokenId)),
    startChild: async () => {
      let finish!: () => void;
      const done = new Promise<void>((resolve) => { finish = resolve; });
      started();
      return { done, stop: async () => { order.push("child_gone"); finish(); } };
    },
    lifecycle: (_bot, state) => { order.push(state); },
  });
  await dispatcher.start(bot);
  await childStarted;
  failReceiver();
  await new Promise<void>((resolve) => setTimeout(resolve, 20));
  assert.ok(order.indexOf("child_gone") < order.indexOf("lease_released"));
  assert.deepEqual(order, ["started", "child_gone", "lease_released", "error"]);
  assert.equal(dispatcher.counters().activeChildren, 0);
  await dispatcher.shutdown();
});
