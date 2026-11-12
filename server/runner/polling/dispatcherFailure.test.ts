/** @fileoverview Фатальный сбой сценария останавливает регистрацию без бесконечных перезапусков. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { NodePollingDispatcher, type PollingBot } from "./dispatcher";
import { withPollingLease } from "./lease";

for (const startupFailure of [true, false]) {
  test(`фатальная ошибка ${startupFailure ? "запуска" : "сценария"} снимает регистрацию однократно`, async () => {
    const events: string[] = [];
    const pending = new Set([1]);
    let starts = 0;
    const bot: PollingBot = { tokenId: 1, token: "fake", botFile: "fake.py", env: {},
      idleTimeout: 30, projectId: 1, workerKey: "1", instance: "1" };
    const redis = {
      set: async () => "OK",
      eval: async () => { events.push("lease_released"); return 1; },
    } as unknown as Parameters<typeof withPollingLease>[0];
    let dispatcher!: NodePollingDispatcher;
    dispatcher = new NodePollingDispatcher({
      hasPending: async () => pending.has(1),
      receive: async (_bot, signal, _wake, ready) => withPollingLease(redis, bot.token, signal,
        async (leaseSignal) => {
          ready();
          await new Promise<void>((resolve) => {
            leaseSignal.addEventListener("abort", () => resolve(), { once: true });
          });
        }, () => dispatcher.quiesceChild(bot.tokenId)),
      startChild: async () => {
        starts++;
        events.push("child_gone");
        if (startupFailure) throw new Error("startup failed");
        return { done: Promise.resolve({ code: 1, signal: null }), stop: async () => {} };
      },
      lifecycle: (_bot, state) => { events.push(state); },
    });
    await dispatcher.start(bot);
    await delay(1100);
    assert.equal(starts, 1);
    assert.deepEqual(events, ["started", "child_gone", "lease_released", "error"]);
    assert.equal(dispatcher.counters().registeredBots, 0);
    assert.equal(dispatcher.counters().activeChildren, 0);
    assert.ok(pending.has(1));
    await dispatcher.shutdown();
    assert.equal(events.filter((event) => event === "error").length, 1);
  });
}
