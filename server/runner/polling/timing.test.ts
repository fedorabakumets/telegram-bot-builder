/** @fileoverview Проверки корреляции задержек и отсутствия секретов в замерах polling. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PollingTiming } from "./timing";

test("разделяет доставку, сохранение и обработку без текста и токена", async () => {
  let now = 10_000;
  const events: object[] = [];
  const timing = new PollingTiming(event => events.push(event), () => now);
  const options = timing.receiver(30, { token: "secret-token", signal: new AbortController().signal,
    queue: { offset: async () => null, enqueue: async () => { now += 40; } },
    onUpdates: async () => {}, request: async () => {
      now += 100;
      return { status: 200, body: { ok: true, result: [{ update_id: 7, message: { date: 9, text: "private-text" } }] } };
    } });
  const response = await options.request!("secret-token", {}, options.signal);
  await options.queue.enqueue(response.body.result as never);
  now += 500;
  timing.handled(30, { type: "stderr", content: "Update id=7 is handled. Duration 200 ms" });
  assert.deepEqual(events.map(event => (event as { stage: string }).stage), ["received", "persisted", "handled"]);
  assert.equal((events[0] as { telegramAgeMs: number }).telegramAgeMs, 1100);
  assert.equal((events[1] as { persistMs: number }).persistMs, 40);
  assert.equal((events[2] as { persistedToHandledMs: number }).persistedToHandledMs, 500);
  assert.doesNotMatch(JSON.stringify(events), /secret-token|private-text/);
  timing.handled(30, { type: "stderr", content: "Update id=7 is handled. Duration 200 ms" });
  assert.equal(events.length, 3);
});

test("сохраняет отказ транспорта и скрывает текст ошибки", async () => {
  const events: object[] = [];
  const timing = new PollingTiming(event => events.push(event));
  const options = timing.receiver(30, { token: "secret", signal: new AbortController().signal,
    queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
    request: async () => { throw new Error("secret-address"); } });
  await assert.rejects(options.request!("secret", {}, options.signal));
  assert.equal((events[0] as { stage: string }).stage, "request_failed");
  assert.doesNotMatch(JSON.stringify(events), /secret-address/);
});

test("принимает только числовые этапы Python из разрешённого списка", () => {
  const events: object[] = [];
  const timing = new PollingTiming(event => events.push(event));
  timing.handled(30, { type: "process", event: "startup_timing", stage: "imports_done", stage_ms: 123, elapsed_ms: 125 });
  timing.handled(30, { type: "process", event: "startup_timing", stage: "secret", stage_ms: 1, elapsed_ms: 1 });
  timing.handled(30, { type: "process", event: "startup_timing", stage: "imports_done", stage_ms: "secret", elapsed_ms: 1 });
  assert.equal(events.length, 1);
  assert.equal((events[0] as { stage: string }).stage, "python_imports_done");
  assert.doesNotMatch(JSON.stringify(events), /secret/);
});

test("одинаковые номера обновлений разных ботов общего процесса не смешивают задержки", async () => {
  let now = 1000;
  const events: Array<Record<string, unknown>> = [];
  const timing = new PollingTiming(event => events.push(event as Record<string, unknown>), () => now);
  for (const tokenId of [30, 31]) {
    const options = timing.receiver(tokenId, { token: "secret", signal: new AbortController().signal,
      queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
      request: async () => ({ status: 200, body: { ok: true, result: [{ update_id: 7 }] } }) });
    await options.request!("secret", {}, options.signal);
    await options.queue.enqueue([{ update_id: 7 }]);
    now += 100;
  }
  timing.handled(31, { type: "stderr", content: "Update id=7 is handled. Duration 20 ms" });
  now += 100;
  timing.handled(30, { type: "stderr", content: "Update id=7 is handled. Duration 30 ms" });
  const handled = events.filter(event => event.stage === "handled");
  assert.deepEqual(handled.map(event => [event.tokenId, event.receiveToHandledMs]), [[31, 100], [30, 300]]);
});
