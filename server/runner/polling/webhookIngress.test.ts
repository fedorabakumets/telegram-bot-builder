/** @fileoverview Проверка Node-webhook без getUpdates: регистрация, запись, пробуждение и остановка. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import type Redis from "ioredis";
import { WebhookIngress } from "./webhookIngress";
import type { PollingBot } from "./dispatcherTypes";

test("webhook остаётся лёгкой регистрацией и пробуждает только после Redis", async () => {
  const methods: string[] = [];
  const payloads: Record<string, unknown>[] = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const part of req) chunks.push(Buffer.from(part));
    methods.push(req.url!.split("/").at(-1)!);
    payloads.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.setHeader("content-type", "application/json"); res.end('{"ok":true,"result":true}');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  let fail = false, writes = 0, wakes = 0, quiesced = 0;
  const redis = { set: async () => "OK", eval: async (script: string) => {
    if (script.includes("HEXISTS")) { if (fail) throw new Error("Redis недоступен"); writes++; }
    return 1;
  } } as unknown as Redis;
  const ingress = new WebhookIngress(async () => redis, () => { assert.ok(writes > 0); wakes++; });
  const bot: PollingBot = { tokenId: 58, token: "12345:fake", projectId: 12, workerKey: "0", instance: "i",
    idleTimeout: 0.1, botFile: "unused.py", env: { TELEGRAM_BOT_API_URL: `http://127.0.0.1:${address.port}` },
    webhook: { url: "https://api.example/api/webhook/12/58", secret: "test-secret" } };
  const abort = new AbortController();
  let ready!: () => void;
  const registered = new Promise<void>(resolve => { ready = resolve; });
  const receiving = ingress.receive(bot, abort.signal, ready, async () => { quiesced++; });
  try {
    await registered;
    assert.deepEqual(methods, ["setWebhook"]);
    assert.equal(payloads[0].url, bot.webhook!.url);
    assert.equal(payloads[0].drop_pending_updates, false);
    assert.equal(await ingress.enqueue(12, 58, { update_id: 10 }, "test-secret"), true);
    assert.equal(writes, 1); assert.equal(wakes, 1);
    await assert.rejects(ingress.enqueue(13, 58, { update_id: 11 }, "test-secret"));
    await assert.rejects(ingress.enqueue(12, 58, { update_id: 11 }, "wrong"));
    assert.equal(writes, 1);
    fail = true;
    await assert.rejects(ingress.enqueue(12, 58, { update_id: 11 }, "test-secret"));
    assert.equal(wakes, 1);
    abort.abort(); await receiving;
    assert.equal(await ingress.enqueue(12, 58, { update_id: 12 }, "test-secret"), false);
    assert.deepEqual(methods, ["setWebhook", "deleteWebhook"]);
    assert.equal(quiesced, 1);
  } finally {
    abort.abort(); await receiving.catch(() => {});
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
