/** @fileoverview Старое подтверждение handoff не завершает ожидание нового запуска. */
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import type { LocalWorkerChannel } from "../bots/localWorkerChannel";
import { waitForWorkerBotStart } from "../bots/waitForWorkerBotStart";
import { RunnerLegacyRoutes } from "./runnerLegacyRoutes";

/** Создаёт системное событие прежнего канала. */
const event = (content: string) => ({ w: "0", i: "test", k: "line" as const,
  l: JSON.stringify({ type: "system", content }) });

test("handoff не прерывает ожидаемый start, пропускает настоящую ошибку нового запуска", async () => {
  const routes = new RunnerLegacyRoutes(), emitter = new EventEmitter();
  routes.started(1);
  const started = waitForWorkerBotStart(emitter, 12, 1, 1000);
  const channel = { sendAsync: async () => {
    assert.equal(routes.observe(event("bot_exited:1:stopped")), true);
    assert.equal(routes.observe(event("bot_stopped:1")), true);
  } } as unknown as LocalWorkerChannel;
  await routes.stopBeforeHandoff(channel, 1);
  assert.equal(routes.observe(event("bot_exited:1:error")), false);
  emitter.emit("bot-exited", 12, 1, "error", "Connection refused");
  await assert.rejects(started, /Не удалось подключиться к сервису/);
});

test("handoff ждёт финальный ACK и не скрывает чужие или последующие stop", async () => {
  const routes = new RunnerLegacyRoutes();
  routes.started(1);
  let finished = false;
  const channel = { sendAsync: async () => {} } as unknown as LocalWorkerChannel;
  const handoff = routes.stopBeforeHandoff(channel, 1).then(() => { finished = true; });
  assert.equal(routes.observe(event("bot_stopped:2")), false);
  assert.equal(routes.observe(event("bot_exited:1:stopped")), true);
  await Promise.resolve();
  assert.equal(finished, false);
  assert.equal(routes.observe(event("bot_stopped:1")), true);
  await handoff;
  assert.equal(routes.observe(event("bot_stopped:1")), false);
});

test("после внутреннего stop приходит успешный новый start", async () => {
  const routes = new RunnerLegacyRoutes(), emitter = new EventEmitter();
  routes.started(1);
  const started = waitForWorkerBotStart(emitter, 12, 1, 1000);
  const channel = { sendAsync: async () => {
    assert.equal(routes.observe(event("bot_stopped:1")), true);
  } } as unknown as LocalWorkerChannel;
  await routes.stopBeforeHandoff(channel, 1);
  emitter.emit("bot-started", 12, 1);
  assert.equal(await started, true);
});
