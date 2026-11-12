/** @fileoverview Проверки обратного давления событий без потери журналов и жизненных состояний. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRunnerEventPublisher } from "./runnerEventPublisher";
import type { RunnerEvent } from "../redis/workerStreams";

/** Создаёт событие stdout с жизненным состоянием в исходном протоколе. */
const event = (text: string): RunnerEvent => ({ k: "line", w: "1", i: "a", l: text });
/** Пропускает завершение обработчиков подтверждений транспорта. */
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test("Давление ограничивает команды Redis и сохраняет порядок всех событий", async () => {
  const sent: RunnerEvent[] = [], done: Array<() => void> = [], pressure: boolean[] = [];
  const publisher = createRunnerEventPublisher({ concurrency: 1, highCount: 4, highBytes: 100000,
    send: (item) => { sent.push(item); return new Promise((resolve) => done.push(resolve)); },
    setPaused: (value) => pressure.push(value), onError: () => assert.fail("отказ не ожидается") });
  const events = [event("log"), event("bot_started:1"), event("bot_stopped:1"),
    { k: "snapshot", w: "", i: "", d: "{}" } as RunnerEvent, { k: "exit", w: "1", i: "a" } as RunnerEvent];
  events.forEach((item) => publisher.publish(item));
  assert.equal(sent.length, 1);
  assert.equal(publisher.snapshot().pendingCount, 5);
  assert.deepEqual(pressure, [true]);
  for (let index = 0; index < events.length; index++) {
    done[index](); await tick();
    if (index === 1) assert.deepEqual(pressure, [true]);
    if (index === 2) assert.deepEqual(pressure, [true, false]);
  }
  await publisher.drain();
  assert.deepEqual(sent, events);
  assert.deepEqual(pressure, [true, false]);
  assert.equal(publisher.snapshot().pendingJsonBytes, 0);
});

test("Несколько подтверждений не превышают лимит параллелизма и не меняют FIFO", async () => {
  const sent: RunnerEvent[] = [], done: Array<() => void> = [];
  const publisher = createRunnerEventPublisher({ concurrency: 2,
    send: (item) => { sent.push(item); return new Promise((resolve) => done.push(resolve)); },
    setPaused: () => undefined, onError: () => assert.fail("отказ не ожидается") });
  const items = Array.from({ length: 6 }, (_, index) => event(String(index)));
  items.forEach((item) => publisher.publish(item));
  assert.equal(publisher.snapshot().inFlight, 2);
  assert.equal(publisher.snapshot().queuedCount, 4);
  done[1](); await tick();
  assert.equal(publisher.snapshot().inFlight, 2);
  assert.deepEqual(sent, items.slice(0, 3));
  done[0](); await tick();
  for (let index = 2; index < items.length; index++) { done[index](); await tick(); }
  await publisher.drain();
  assert.deepEqual(sent, items);
});

test("Порог байтов учитывает UTF-8 и ожидает реального подтверждения", async () => {
  let done!: () => void;
  const pressure: boolean[] = [];
  const item = event("привет");
  const bytes = Buffer.byteLength(JSON.stringify(item));
  const publisher = createRunnerEventPublisher({ highBytes: bytes, highCount: 100,
    send: () => new Promise((resolve) => { done = resolve; }), setPaused: (value) => pressure.push(value),
    onError: () => assert.fail("отказ не ожидается") });
  publisher.publish(item);
  assert.equal(publisher.snapshot().pendingJsonBytes, bytes);
  assert.deepEqual(pressure, [true]);
  let drained = false;
  const drain = publisher.drain().then(() => { drained = true; });
  await tick(); assert.equal(drained, false);
  done(); await drain;
  assert.deepEqual(pressure, [true, false]);
});

test("Окончательный отказ и синхронная ошибка освобождают очередь и явно сообщаются", async () => {
  const failed: RunnerEvent[] = [];
  let calls = 0;
  const publisher = createRunnerEventPublisher({ concurrency: 1,
    send: () => { if (++calls === 1) throw new Error("синхронная ошибка"); return Promise.reject(new Error("отказ")); },
    setPaused: () => undefined, onError: (_error, item) => { failed.push(item); throw new Error("ошибка журнала"); } });
  const items = [event("bot_started:1"), event("bot_exited:1:error")];
  items.forEach((item) => publisher.publish(item));
  await publisher.drain();
  assert.deepEqual(failed, items);
  assert.equal(publisher.snapshot().failures, 2);
  assert.equal(publisher.snapshot().inFlight, 0);
});
