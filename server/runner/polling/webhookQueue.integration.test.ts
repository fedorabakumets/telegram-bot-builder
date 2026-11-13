/** @fileoverview Надёжность webhook-очереди на настоящем Redis без затрагивания рабочих ключей. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import Redis from "ioredis";
import { DemandQueue, QueueFullError, type DemandQueueOptions } from "./queue";

/** Выделяет уникальные тестовые ключи и удаляет только их после проверки. */
async function fixture(run: (queue: DemandQueue, redis: Redis, restore: () => DemandQueue) => Promise<void>,
  options: DemandQueueOptions = {}): Promise<void> {
  const redis = new Redis(process.env.LOCAL_REDIS_TEST_URL ?? "redis://127.0.0.1:6379", {
    lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1, connectTimeout: 1000,
  });
  redis.on("error", () => {});
  const settings = { keyPrefix: `tbb:test:webhook:${randomUUID()}`, ...options };
  const restore = () => new DemandQueue(redis, 999, settings);
  const queue = restore();
  try { await redis.connect(); await run(queue, redis, restore); }
  finally {
    if (redis.status === "end") await redis.connect();
    if (redis.status === "ready") await redis.del(...queue.keys, queue.webhookSeenKey);
    redis.disconnect();
  }
}

test("webhook принимает поздний меньший ID и сохраняет порядок поступления независимо от polling offset", async () => {
  await fixture(async (queue) => {
    await queue.enqueue([{ update_id: 500 }]);
    await queue.ack(500);
    await queue.enqueueWebhook({ update_id: 12 });
    await queue.enqueueWebhook({ update_id: 11 });
    assert.equal((await queue.peek())?.update_id, 12);
    await queue.ack(12);
    assert.equal((await queue.peek())?.update_id, 11);
    assert.equal(await queue.offset(), 501);
  });
});

test("история повторов переживает ACK Python и новый экземпляр очереди", async () => {
  await fixture(async (queue, redis, restore) => {
    await queue.enqueueWebhook({ update_id: 4 });
    await queue.ack(4);
    await restore().enqueueWebhook({ update_id: 4 });
    assert.equal(await queue.peek(), null);
    assert.equal(await redis.zcard(queue.webhookSeenKey), 1);
    assert.equal(await redis.get(queue.keys[3]), "0");
  });
});

test("конкурентные приёмы и повтор после подтверждения создают только одну доставку", async () => {
  await fixture(async (queue, redis, restore) => {
    await Promise.all(Array.from({ length: 30 }, () => restore().enqueueWebhook({ update_id: 9 })));
    assert.equal(await redis.zcard(queue.keys[0]), 1);
    await Promise.all([queue.ack(9), restore().enqueueWebhook({ update_id: 9 })]);
    assert.equal(await queue.peek(), null);
    assert.equal(await redis.zcard(queue.webhookSeenKey), 1);
  });
});

test("переполнение не подтверждает новую доставку, а повтор принятой допускается при полном лимите", async () => {
  await fixture(async (queue, redis) => {
    await queue.enqueueWebhook({ update_id: 1 });
    await queue.enqueueWebhook({ update_id: 1 });
    await assert.rejects(queue.enqueueWebhook({ update_id: 2 }), QueueFullError);
    assert.equal(await redis.zscore(queue.webhookSeenKey, "2"), null);
    await queue.ack(1);
    await queue.enqueueWebhook({ update_id: 2 });
    assert.equal((await queue.peek())?.update_id, 2);
  }, { maxPending: 1 });
});

test("предел истории сохраняет повторы до срока и освобождается после истечения", async () => {
  await fixture(async (queue, redis) => {
    await queue.enqueueWebhook({ update_id: 1 });
    await queue.ack(1);
    await assert.rejects(queue.enqueueWebhook({ update_id: 2 }), QueueFullError);
    await redis.zadd(queue.webhookSeenKey, 1, "1");
    await queue.enqueueWebhook({ update_id: 2 });
    assert.equal(await redis.zcard(queue.webhookSeenKey), 1);
    assert.ok((await redis.ttl(queue.webhookSeenKey)) > 0);
  }, { maxWebhookHistory: 1 });
});

test("повтор после потери ответа Redis не создаёт вторую доставку", async () => {
  await fixture(async (queue, redis, restore) => {
    await queue.enqueueWebhook({ update_id: 8 });
    const ended = once(redis, "end");
    redis.disconnect();
    await ended;
    await assert.rejects(queue.enqueueWebhook({ update_id: 8 }));
    await redis.connect();
    await restore().enqueueWebhook({ update_id: 8 });
    assert.equal(await redis.zcard(queue.keys[0]), 1);
  });
});

test("лимит UTF-8 и некорректный ID не оставляют подтверждённую историю", async () => {
  await fixture(async (queue, redis) => {
    await assert.rejects(queue.enqueueWebhook({ update_id: 1, text: "Я".repeat(100) }), QueueFullError);
    await assert.rejects(queue.enqueueWebhook({ update_id: -1 }), /update_id/);
    assert.equal(await redis.zcard(queue.keys[0]), 0);
    assert.equal(await redis.zcard(queue.webhookSeenKey), 0);
  }, { maxBytes: 40 });
});
