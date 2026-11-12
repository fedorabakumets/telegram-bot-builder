/** @fileoverview Проверки безопасного снимка применённых режимов, остановок и неизвестной активности. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { RunnerBotModes } from "./runnerBotModes";

test("снимок хранит применённый режим без секретов и не меняется вслед за исходной командой", () => {
  const modes = new RunnerBotModes();
  const env = { BOT_POLLING_MODE: "process", BOT_ON_DEMAND_IDLE_SECONDS: "15", TOKEN: "secret" };
  modes.start({ token_id: 30, env });
  env.BOT_POLLING_MODE = "direct";
  assert.deepEqual(modes.snapshot(), [{ tokenId: 30, mode: "process", activity: "starting", idleSeconds: 15 }]);
  assert.equal(JSON.stringify(modes.snapshot()).includes("secret"), false);
  modes.observe("bot_started:30");
  assert.equal(modes.snapshot()[0].activity, "unknown");
  assert.equal(modes.snapshot([{ tokenId: 30, activity: "sleeping" }])[0].activity, "sleeping");
  modes.observe("bot_exited:30:error");
  assert.deepEqual(modes.snapshot(), []);
});

test("фильтр токенов оставляет остальные боты в постоянном режиме; остановка удаляет запись", () => {
  const modes = new RunnerBotModes();
  modes.start({ token_id: 31, env: { BOT_POLLING_MODE: "ondemand", BOT_ON_DEMAND_TOKEN_IDS: "30,32" } });
  assert.deepEqual(modes.snapshot(), [{ tokenId: 31, mode: "direct", activity: "starting" }]);
  modes.observe("bot_started:31");
  assert.equal(modes.snapshot()[0].activity, "unknown");
  modes.observe("bot_stopped:31");
  assert.deepEqual(modes.snapshot(), []);
});
