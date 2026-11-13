/** @fileoverview Проверяет маршрутизацию process, ограничения и разные ID Telegram и базы данных. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRunnerConfig } from "../runnerConfig";
import { processPollingBot, telegramPollingId, usesNodePolling, type ProcessStartCommand } from "./runtimeSettings";

/** Возвращает команду без действительных секретов и сетевых подключений. */
function command(): ProcessStartCommand {
  return { cmd: "start_bot", token_id: 31, token: "900001:fake", bot_file: "bot.py",
    env: { BOT_POLLING_MODE: "process", REDIS_URL: "redis://unused", BOT_ON_DEMAND_IDLE_SECONDS: "30" } };
}

test("Node-приёмник включается только отдельным флагом исполнителя", () => {
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused" }).processPolling, "python");
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_POLLING: "node" }).processPolling, "node");
  assert.throws(() => loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_POLLING: "other" }));
});

test("общий обработчик действует по умолчанию, отдельный остаётся явным откатом", () => {
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused" }).processHandler, "shared");
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_HANDLER: " shared " }).processHandler, "shared");
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_HANDLER: "" }).processHandler, "shared");
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_HANDLER: "isolated" }).processHandler, "isolated");
  assert.throws(() => loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_HANDLER: "other" }), /RUNNER_PROCESS_HANDLER/);
});

test("direct и ondemand остаются на прежнем Python независимо от доступности Node", () => {
  for (const mode of ["direct", "ondemand"]) {
    const input = command(); input.env!.BOT_POLLING_MODE = mode;
    assert.equal(usesNodePolling(input), false);
  }
  assert.equal(usesNodePolling(command()), true);
});

test("список выбранных токенов сохраняет прежнюю семантику настройки", () => {
  const input = command(); input.env!.BOT_ON_DEMAND_TOKEN_IDS = "11, 32";
  assert.equal(usesNodePolling(input), false);
  input.env!.BOT_ON_DEMAND_TOKEN_IDS = "11, 31";
  assert.equal(usesNodePolling(input), true);
});

test("очередь использует Telegram ID, а состояние и снимок сохраняют ID базы", () => {
  const bot = processPollingBot(command(), "0", "instance");
  assert.equal(bot.tokenId, 31);
  assert.equal(telegramPollingId(bot.token), 900001);
  assert.equal(bot.projectId, 0);
});

test("ошибочные настройки отклоняются до открытия polling", () => {
  const webhook = command(); webhook.webhook_url = "https://unused";
  assert.throws(() => processPollingBot(webhook, "0", "i"), /webhook/);
  for (const [key, value] of [["BOT_ON_DEMAND_IDLE_SECONDS", "0"], ["BOT_ON_DEMAND_MAX_ACTIVE", "1.5"], ["REDIS_URL", ""]]) {
    const input = command(); input.env![key] = value;
    assert.throws(() => processPollingBot(input, "0", "i"));
  }
  assert.throws(() => telegramPollingId("fake:token"));
});

test("webhook process сохраняет проект и внешний приёмник без отдельного polling", () => {
  const input = command();
  input.project_id = 12;
  input.webhook_url = "https://api.example/";
  input.env!.WEBHOOK_SECRET_TOKEN = "test-secret";
  const bot = processPollingBot(input, "0", "i", false);
  assert.deepEqual(bot.webhook, { url: "https://api.example/api/webhook/12/31", secret: "test-secret" });
  assert.equal(bot.projectId, 12);
  assert.equal(bot.env.BOT_WEBHOOK_INGRESS, "node");
  assert.equal(usesNodePolling(input), true);
});

/** Устаревший предел отдельных процессов не должен ограничивать общий интерпретатор. */
test("общий обработчик игнорирует предел процессов, сохраняя проверки простоя и Redis", () => {
  for (const value of ["4", "0", "100", "1.5", "не число"]) {
    const input = command(); input.env!.BOT_ON_DEMAND_MAX_ACTIVE = value;
    assert.equal(processPollingBot(input, "0", "i", false).tokenId, 31);
    if (!["4", "0"].includes(value)) assert.throws(() => processPollingBot(input, "0", "i", true));
  }
  for (const [key, value] of [["BOT_ON_DEMAND_IDLE_SECONDS", "0"], ["REDIS_URL", ""]]) {
    const input = command(); input.env![key] = value;
    assert.throws(() => processPollingBot(input, "0", "i", false));
  }
});
