/** @fileoverview Проверки совместимой очереди на настоящем Redis с изолированными ключами. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import Redis from "ioredis";
import { DemandQueue, QueueFullError } from "./queue";

/** Создаёт только тестовые ключи и гарантированно удаляет их после проверки. */
async function fixture(run: (queue: DemandQueue, redis: Redis) => Promise<void>, maxPending = 2, maxBytes = 8192) {
  const redis = new Redis(process.env.LOCAL_REDIS_TEST_URL ?? "redis://127.0.0.1:6379", {
    lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 1000, commandTimeout: 2000,
  });
  const queue = new DemandQueue(redis, 999, { keyPrefix: `tbb:test:node-poll:${randomUUID()}`, maxPending, maxBytes });
  try {
    await redis.connect();
    await run(queue, redis);
  } finally {
    if (redis.status === "ready") await redis.del(...queue.keys);
    redis.disconnect();
  }
}

test("пакет сохраняется до offset, повтор и новый экземпляр не дублируют обновления", async () => {
  await fixture(async (queue, redis) => {
    const updates = [{ update_id: 12, message: { text: "Привет" } }, { update_id: 11 }];
    await queue.enqueue(updates);
    assert.equal(await queue.offset(), 13);
    assert.equal(await queue.hasPending(), true);
    assert.equal((await queue.peek())?.update_id, 11);
    const restored = new DemandQueue(redis, 999, { keyPrefix: queue.keys[0].split(":{999}")[0] });
    await restored.enqueue(updates);
    assert.equal(await redis.zcard(queue.keys[0]), 2);
    await restored.ack(11);
    await restored.ack(11);
    assert.equal((await restored.peek())?.update_id, 12);
    await restored.ack(12);
    assert.equal(await restored.peek(), null);
    assert.equal(await restored.hasPending(), false);
    assert.equal(await redis.get(queue.keys[3]), "0");
  });
});

test("переполнение количества атомарно отвергает весь пакет и не сдвигает offset", async () => {
  await fixture(async queue => {
    await queue.enqueue([{ update_id: 1 }]);
    await assert.rejects(queue.enqueue([{ update_id: 2 }, { update_id: 3 }]), QueueFullError);
    assert.equal(await queue.offset(), 2);
    assert.equal((await queue.peek())?.update_id, 1);
    await queue.ack(1);
    assert.equal(await queue.peek(), null);
  });
});

test("лимит байтов учитывает UTF-8 и ошибка не оставляет частичного пакета", async () => {
  await fixture(async (queue, redis) => {
    await assert.rejects(queue.enqueue([{ update_id: 1, text: "Я".repeat(20) }]), QueueFullError);
    assert.equal(await queue.offset(), null);
    assert.equal(await redis.zcard(queue.keys[0]), 0);
  }, 2, 45);
});

test("после шести суток принимается новый меньший ID без потери старого pending", async () => {
  await fixture(async (queue, redis) => {
    await queue.enqueue([{ update_id: 1000 }]);
    await redis.set(queue.keys[5], Math.floor(Date.now() / 1000) - 518401);
    assert.equal(await queue.offset(), null);
    await queue.enqueue([{ update_id: 7 }]);
    assert.equal(await queue.offset(), 8);
    assert.equal((await queue.peek())?.update_id, 1000);
    await queue.ack(1000);
    assert.equal((await queue.peek())?.update_id, 7);
  });
});

test("некорректный идентификатор не изменяет очередь", async () => {
  await fixture(async queue => {
    await assert.rejects(queue.enqueue([{ update_id: -1 }]), /update_id/);
    assert.equal(await queue.offset(), null);
  });
});
