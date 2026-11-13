/** @fileoverview Проверка авторизации, границ и доставки внутреннего webhook сервера. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { handleRunnerWebhook, startRunnerWebhookServer, type RunnerWebhookOptions } from "./runnerWebhookServer";

/** Поднимает настоящий HTTP для проверки потока запроса и освобождает сокеты. */
async function fixture(run: (url: string, calls: Array<{ url: string; init?: RequestInit }>) => Promise<void>, status = 202): Promise<void> {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const options: RunnerWebhookOptions = { secret: "a".repeat(40), isRunning: (projectId, id) => projectId === 12 && id === 58,
    deliver: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (status === 0) throw new Error("недоступен");
      return new Response(null, { status });
    }) as typeof fetch };
  const server = createServer((req, res) => { void handleRunnerWebhook(req, res, options); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`, calls); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

/** Заголовки действующего внутреннего клиента. */
const headers = { Authorization: `Bearer ${"a".repeat(40)}`, "Content-Type": "application/json",
  "X-Telegram-Bot-Api-Secret-Token": "telegram_secret" };

test("авторизация закрывает внутренний маршрут до обращения к Python", async () => {
  await fixture(async (url, calls) => {
    assert.equal((await fetch(`${url}/internal/webhook/12/58`, { method: "POST", body: "{}" })).status, 401);
    assert.equal(calls.length, 0);
  });
});

test("доставка сохраняет JSON, секрет Telegram и статус Python", async () => {
  await fixture(async (url, calls) => {
    assert.equal((await fetch(`${url}/internal/webhook/12/58`, { method: "POST", headers, body: '{"update_id":123}' })).status, 202);
    assert.equal(calls[0].url, "http://127.0.0.1:9058/webhook");
    assert.equal(calls[0].init?.body, '{"update_id":123}');
    assert.equal(new Headers(calls[0].init?.headers).get("X-Telegram-Bot-Api-Secret-Token"), "telegram_secret");
  });
});

test("неактивные боты и недоступный Python возвращают повторяемую ошибку", async () => {
  await fixture(async (url, calls) => {
    assert.equal((await fetch(`${url}/internal/webhook/12/59`, { method: "POST", headers, body: "{}" })).status, 503);
    assert.equal((await fetch(`${url}/internal/webhook/13/58`, { method: "POST", headers, body: "{}" })).status, 503);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(`${url}/internal/webhook/12/58`, { method: "POST", headers, body: "{}" })).status, 503);
  }, 0);
});

test("неправильные ID, JSON и большой пакет не доставляются", async () => {
  await fixture(async (url, calls) => {
    for (const [path, body, expected] of [
      ["12/58abc", "{}", 404], ["12/60000", "{}", 400], ["9007199254740992/58", "{}", 400],
      ["12/58", "{", 400], ["12/58", "x".repeat(1024 * 1024 + 1), 413],
    ] as const) assert.equal((await fetch(`${url}/internal/webhook/${path}`, { method: "POST", headers, body })).status, expected);
    assert.equal(calls.length, 0);
  });
});

test("порт отключён без секрета и слабый секрет запрещён", async () => {
  assert.equal(await startRunnerWebhookServer(() => true, {}), undefined);
  await assert.rejects(startRunnerWebhookServer(() => true, { RUNNER_WEBHOOK_SECRET: "weak" }), /32/);
});
