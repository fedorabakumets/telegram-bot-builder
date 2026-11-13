/** @fileoverview Подтверждение передачи постоянного бота без ложной остановки нового запуска. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { PermanentActivations } from "./permanentActivations";

/** Создаёт системное сообщение без пользовательских данных. */
const event = (content: string) => ({ type: "system", content });

test("handoff скрывает только старый выход и ждёт финальный bot_stopped", async () => {
  const activations = new PermanentActivations();
  activations.tokens.add(1);
  let completed = false;
  const stopping = activations.stop(1, async () => {});
  void stopping.then(() => { completed = true; });
  assert.equal(activations.observe(event("bot_exited:1:stopped")), true);
  await Promise.resolve();
  assert.equal(completed, false);
  assert.equal(activations.tokens.has(1), true);
  assert.equal(activations.observe(event("bot_stopped:1")), true);
  await stopping;
  assert.equal(activations.tokens.has(1), false);
  assert.equal(activations.observe(event("bot_exited:1:error")), false);
  assert.equal(activations.observe(event("bot_stopped:1")), false);
});

test("обычный stop и ошибка другого бота не скрываются ожиданием handoff", async () => {
  const activations = new PermanentActivations();
  activations.tokens.add(1);
  const stopping = activations.stop(1, async () => {});
  assert.equal(activations.observe(event("bot_stopped:2")), false);
  assert.equal(activations.observe(event("bot_exited:1:error")), false);
  assert.equal(activations.observe(event("bot_stopped:1")), true);
  await stopping;
  activations.tokens.add(1);
  assert.equal(activations.observe(event("bot_stopped:1")), false);
});

test("неотправленный handoff снимает фильтр, сохраняя настоящую ошибку", async () => {
  const activations = new PermanentActivations();
  activations.tokens.add(1);
  await assert.rejects(activations.stop(1, async () => { throw new Error("Не отправлено"); }));
  assert.equal(activations.observe(event("bot_exited:1:error")), false);
  assert.equal(activations.observe(event("bot_stopped:1")), false);
});
