/** @fileoverview Проверка сна и пробуждения webhook-очереди под общей блокировкой Redis. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import Redis from "ioredis";
import { DemandQueue } from "./queue";
import { NodePollingDispatcher, type PollingBot } from "./dispatcher";
import { withPollingLease } from "./lease";

/** Ожидает наблюдаемое условие с конечным сроком, не подменяя его фиксированным сном. */
async function until(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 3000;
  while (!condition()) {
    if (Date.now() >= deadline) throw new Error("Не наступило состояние тестового обработчика");
    await delay(5);
  }
}

test("один владелец обслуживает webhook, засыпает и принимает обновление при завершении обработчика", async () => {
  const redis = new Redis(process.env.LOCAL_REDIS_TEST_URL ?? "redis://127.0.0.1:6379", {
    lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 1000,
  });
  const token = `test-${randomUUID()}`;
  const queue = new DemandQueue(redis, 999, { keyPrefix: `tbb:test:webhook-life:${randomUUID()}` });
  const bot: PollingBot = { tokenId: 999, token, projectId: 1, botFile: "unused.py", env: {},
    workerKey: "test", instance: "test", idleTimeout: 1 };
  const processed: number[] = [];
  let children = 0, maximumChildren = 0, errors = 0;
  let finishFirst!: () => void;
  const firstMayFinish = new Promise<void>((resolve) => { finishFirst = resolve; });
  /** Создаёт конкурирующий исполнитель с общей очередью и общей блокировкой бота. */
  const createDispatcher = () => {
    let dispatcher!: NodePollingDispatcher;
    dispatcher = new NodePollingDispatcher({
      hasPending: () => queue.hasPending(),
      receive: (_bot, signal, _wake, ready) => withPollingLease(redis, token, signal, async (leased) => {
        ready();
        await new Promise<void>((resolve) => {
          if (leased.aborted) resolve();
          else leased.addEventListener("abort", () => resolve(), { once: true });
        });
      }, () => dispatcher.quiesceChild(bot.tokenId)),
      startChild: async () => {
        children++;
        maximumChildren = Math.max(maximumChildren, children);
        const done = (async () => {
          try {
            const update = await queue.peek();
            if (update) {
              processed.push(update.update_id);
              await queue.ack(update.update_id);
              if (update.update_id === 1) await firstMayFinish;
            }
          } finally { children--; }
        })();
        return { done, stop: async () => { finishFirst(); await done; } };
      },
      lifecycle: (_bot, state) => { if (state === "error") errors++; },
    });
    return dispatcher;
  };
  const first = createDispatcher(), second = createDispatcher();
  try {
    await redis.connect();
    await first.start(bot);
    await until(() => first.counters().registeredBots === 1);
    await queue.enqueueWebhook({ update_id: 1 });
    first.wake(999);
    await until(() => processed.length === 1);
    await second.start(bot);
    await until(() => errors === 1);
    await queue.enqueueWebhook({ update_id: 2 });
    first.wake(999);
    finishFirst();
    await until(() => processed.length === 2 && children === 0);
    assert.equal(maximumChildren, 1);
    await queue.enqueueWebhook({ update_id: 3 });
    first.wake(999);
    await until(() => processed.length === 3 && children === 0);
    await queue.enqueueWebhook({ update_id: 1 });
    assert.deepEqual(processed, [1, 2, 3]);
    assert.equal(await queue.hasPending(), false);
  } finally {
    finishFirst();
    await Promise.all([first.shutdown(), second.shutdown()]);
    if (redis.status === "ready") await redis.del(...queue.keys, queue.webhookSeenKey, `bot:lock:${token.slice(-10)}`);
    redis.disconnect();
  }
});
