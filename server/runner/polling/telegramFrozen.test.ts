/** @fileoverview Подтверждение заморозки Telegram: строгий ответ, отпечаток и остановка регистрации до повторов. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type Redis from "ioredis";
import { requestUpdates } from "./transport";
import { TelegramBotFrozen, confirmedTelegramFrozen } from "./telegramFrozen";
import { runtimeFailureEvent } from "./runtimeFailureEvent";
import { withPollingLease } from "./lease";
import { runPollingReceiver } from "./receiver";
import { WebhookIngress } from "./webhookIngress";
import { NodePollingDispatcher } from "./dispatcher";
import type { PollingBot } from "./dispatcherTypes";

/** Двойник Bot API всегда возвращает структурированную заморозку; подсчитывает обращения без секретов. */
async function api(run: (base: string, methods: string[]) => Promise<void>): Promise<void> {
  const methods: string[] = [];
  const server = createServer((req, res) => {
    methods.push(req.url!.split("/").at(-1)!);
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error_code: 400, description: "Bad Request: FROZEN_METHOD_INVALID" }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await run(`http://127.0.0.1:${(server.address() as { port: number }).port}`, methods); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

/** Регистрация с фиктивным секретом, никогда не используемым против настоящего Telegram. */
const bot: PollingBot = { tokenId: 58, token: "12345:old-secret", projectId: 12, workerKey: "0", instance: "i",
  idleTimeout: 1, botFile: "unused.py", env: {}, webhook: { url: "https://api.example/api/webhook/12/58", secret: "secret" } };

test("BotAPI400 заморозки сохраняет метод и отпечаток, остальные400 не классифицируются", async () => {
  await api(async base => {
    for (const method of ["getUpdates", "setWebhook", "deleteWebhook"] as const) {
      await assert.rejects(requestUpdates(bot.token, {}, new AbortController().signal, base, 1024, method), error => {
        assert.ok(error instanceof TelegramBotFrozen);
        assert.equal(error.method, method);
        assert.equal(error.tokenFingerprint, createHash("sha256").update(bot.token).digest("hex"));
        assert.equal(JSON.stringify(error).includes(bot.token), false);
        return true;
      });
    }
  });
  const frozen = { ok: false, error_code: 400, description: "Bad Request: FROZEN_METHOD_INVALID" };
  assert.equal(confirmedTelegramFrozen(400, { ...frozen, description: "FROZEN_METHOD_INVALID" }), true);
  for (const [status, body] of [[200, frozen], [401, frozen], [400, { ...frozen, ok: true }],
    [400, { ...frozen, error_code: "400" }], [400, { ...frozen, description: "FROZEN_METHOD_INVALID_EXTRA" }],
    [400, { ...frozen, description: "Third-party says FROZEN_METHOD_INVALID" }], [400, {}]] as const)
    assert.equal(confirmedTelegramFrozen(status, body), false);
});

test("заморозка polling и webhook завершает регистрацию с событием до выхода, без повторов и Python", async () => {
  await api(async (base, methods) => {
    for (const kind of ["polling", "webhook"]) {
      const events: string[] = [];
      let finished!: () => void;
      const done = new Promise<void>(resolve => { finished = resolve; });
      const redis = { set: async () => "OK", eval: async () => 1 } as unknown as Redis;
      const input = { ...bot, env: { TELEGRAM_BOT_API_URL: base } };
      const ingress = new WebhookIngress(async () => redis, () => {});
      const before = methods.length;
      const dispatcher = new NodePollingDispatcher({ hasPending: async () => false,
        receive: async (_bot, signal, _wake, ready) => {
          if (kind === "webhook") return ingress.receive(input, signal, ready, async () => {});
          await withPollingLease(redis, input.token, signal, owned => runPollingReceiver({ token: input.token, signal: owned,
            queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
            request: (token, payload, abort) => requestUpdates(token, payload, abort, base) }));
        }, startChild: async () => { throw new Error("Python не должен запускаться"); },
        onError: (failedBot, error) => { const event = runtimeFailureEvent(failedBot, error); assert.ok(event); events.push(event); },
        lifecycle: (_bot, state) => { events.push(state); if (state === "error") finished(); },
      });
      await dispatcher.start(input); await done;
      const failure = JSON.parse(events[0]);
      assert.equal(failure.type, "bot_runtime_error"); assert.equal(failure.code, "telegram_frozen");
      assert.equal(failure.source, "telegram_bot_api"); assert.equal(failure.token_id, 58);
      assert.equal(failure.tokenFingerprint, createHash("sha256").update(bot.token).digest("hex"));
      assert.deepEqual(events.slice(1), ["error"]);
      assert.equal(methods.length - before, 1);
      assert.equal(runtimeFailureEvent(input, new Error("HTTP400 FROZEN_METHOD_INVALID")), undefined);
      assert.equal(await dispatcher.stop(58), false);
      await dispatcher.shutdown();
    }
  });
});

test("событие хранит запуск источника, даже если регистрация уже заменена", () => {
  const source = { ...bot, env: { BOT_LAUNCH_ID: "123" } };
  const event = runtimeFailureEvent(source, new TelegramBotFrozen(source.token, "getUpdates"));
  source.env.BOT_LAUNCH_ID = "456";
  assert.equal(JSON.parse(event!).launch_id, 123);
});
