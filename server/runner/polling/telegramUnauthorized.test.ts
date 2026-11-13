/** @fileoverview Проверяет подтверждённый Telegram401, сохранение причины и защиту секретов в событиях runtime. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type Redis from "ioredis";
import { requestUpdates } from "./transport";
import { TelegramTokenUnauthorized, confirmedTelegramUnauthorized } from "./telegramUnauthorized";
import { runtimeFailureEvent } from "./runtimeFailureEvent";
import { withPollingLease } from "./lease";
import { runPollingReceiver } from "./receiver";
import { WebhookIngress } from "./webhookIngress";
import { NodePollingDispatcher } from "./dispatcher";
import type { PollingBot } from "./dispatcherTypes";

/** Поднимает изолированный двойник Bot API с заранее выбранным ответом. */
async function api(status: number, body: unknown, run: (base: string) => Promise<void>): Promise<void> {
  const server = createServer((_req, res) => { res.writeHead(status, { "content-type": "application/json" });
    res.end(typeof body === "string" ? body : JSON.stringify(body)); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as { port: number }).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

/** Несекретная конфигурация тестовой регистрации. */
const bot: PollingBot = { tokenId: 58, token: "12345:old-secret", projectId: 12, workerKey: "0", instance: "i",
  idleTimeout: 1, botFile: "unused.py", env: {}, webhook: { url: "https://api.example/api/webhook/12/58", secret: "webhook-secret" } };

test("только структурированный HTTP401 Telegram подтверждает отказ авторизации", async () => {
  const body = { ok: false, error_code: 401, description: "Unauthorized" };
  await api(401, body, async base => {
    for (const method of ["getUpdates", "setWebhook", "deleteWebhook"] as const) {
      await assert.rejects(requestUpdates(bot.token, {}, new AbortController().signal, base, 1024, method), error => {
        assert.ok(error instanceof TelegramTokenUnauthorized);
        assert.equal(error.method, method);
        assert.equal(error.tokenFingerprint, createHash("sha256").update(bot.token).digest("hex"));
        assert.equal(error.message.includes(bot.token), false);
        return true;
      });
    }
  });
  for (const [status, value] of [[401, {}], [200, body], [403, body], [401, { ...body, ok: true }],
    [401, { ...body, error_code: "401" }], [401, { ...body, description: "Third party Unauthorized" }]] as const)
    assert.equal(confirmedTelegramUnauthorized(status, value), false);
  await api(401, "<html>Unauthorized</html>", async base => {
    await assert.rejects(requestUpdates(bot.token, {}, new AbortController().signal, base), error => {
      assert.equal(error instanceof TelegramTokenUnauthorized, false); return true;
    });
  });
});

test("401 polling и webhook проходит через lease до события перед bot_exited", async () => {
  await api(401, { ok: false, error_code: 401, description: "Unauthorized" }, async base => {
    for (const kind of ["polling", "webhook"]) {
      const events: string[] = [];
      let finished!: () => void;
      const done = new Promise<void>(resolve => { finished = resolve; });
      const redis = { set: async () => "OK", eval: async () => 1 } as unknown as Redis;
      const input = { ...bot, env: { TELEGRAM_BOT_API_URL: base } };
      const ingress = new WebhookIngress(async () => redis, () => {});
      const dispatcher = new NodePollingDispatcher({
        hasPending: async () => false,
        receive: async (_bot, signal, _wake, ready) => {
          if (kind === "webhook") return ingress.receive(input, signal, ready, async () => {});
          await withPollingLease(redis, input.token, signal, owned => runPollingReceiver({ token: input.token, signal: owned,
            queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
            request: (token, payload, abort) => requestUpdates(token, payload, abort, base) }));
        },
        startChild: async () => { throw new Error("Python не должен запускаться"); },
        onError: (failedBot, error) => { const event = runtimeFailureEvent(failedBot, error); assert.ok(event); events.push(event); },
        lifecycle: (_bot, state) => { events.push(state); if (state === "error") finished(); },
      });
      await dispatcher.start(input);
      await done;
      const failure = JSON.parse(events[0]);
      assert.equal(failure.type, "bot_runtime_error");
      assert.equal(failure.code, "telegram_unauthorized");
      assert.equal(failure.source, "telegram_bot_api");
      assert.equal(failure.token_id, 58);
      assert.deepEqual(events.slice(1), ["error"]);
      assert.equal(events.join().includes(bot.token), false);
      assert.equal(runtimeFailureEvent(input, new Error("Third-party 401 Unauthorized")), undefined);
      await dispatcher.shutdown();
    }
  });
});
