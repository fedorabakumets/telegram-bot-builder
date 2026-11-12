/** @fileoverview Проверяет восстановление polling после потери собственного Redis-соединения без остановки сервера. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import Redis from "ioredis";
import { DemandQueue } from "./queue";
import { runPollingReceiver } from "./receiver";

/** Дожидается закрытия только собственного тестового соединения перед повторным подключением. */
async function disconnect(redis: Redis): Promise<void> {
  const ended = once(redis, "end");
  redis.disconnect();
  await ended;
}

/** Ограничивает тест уникальными ключами и отдельным соединением, не затрагивая работающих ботов. */
async function fixture(run: (queue: DemandQueue, redis: Redis) => Promise<void>): Promise<void> {
  const redis = new Redis(process.env.LOCAL_REDIS_TEST_URL ?? "redis://127.0.0.1:6379", {
    lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1,
    connectTimeout: 1000, commandTimeout: 2000,
  });
  redis.on("error", () => {});
  const queue = new DemandQueue(redis, 999, { keyPrefix: `tbb:test:recovery:${randomUUID()}` });
  try { await redis.connect(); await run(queue, redis); }
  finally {
    if (redis.status === "end") await redis.connect();
    if (redis.status === "ready") await redis.del(...queue.keys);
    redis.disconnect();
  }
}

test("потерянный ответ Redis после записи не теряет и не дублирует пакет после переподключения", async () => {
  await fixture(async (queue, redis) => {
    const controller = new AbortController();
    let requests = 0, writes = 0, wakeups = 0, reconnects = 0;
    const offsets: (number | undefined)[] = [];
    await runPollingReceiver({ token: "fake-recovery-token", signal: controller.signal,
      queue: { offset: () => queue.offset(), enqueue: async (updates) => {
        await queue.enqueue(updates);
        if (++writes === 1) {
          await disconnect(redis);
          throw new Error("Ответ сохранённого пакета потерян при разрыве соединения");
        }
      } },
      onUpdates: async () => { wakeups++; },
      wait: async () => {
        if (++reconnects > 2) { controller.abort(); throw new Error("Повторное восстановление не ожидалось"); }
        await redis.connect();
      },
      request: async (_token, payload) => {
        requests++;
        offsets.push((payload as { offset?: number }).offset);
        if (requests === 2) {
          controller.abort();
        }
        return { status: 200, body: { ok: true, result: requests === 1 ? [{ update_id: 41 }] : [] } };
      },
    });
    assert.equal(reconnects, 1);
    assert.equal(requests, 2);
    assert.equal(writes, 2);
    assert.deepEqual(offsets, [undefined, 42]);
    assert.equal(wakeups, 1);
    assert.equal(await redis.zcard(queue.keys[0]), 1);
    assert.equal((await queue.peek())?.update_id, 41);
    await queue.ack(41);
    assert.equal(await queue.hasPending(), false);
    assert.equal(await redis.get(queue.keys[3]), "0");
    await queue.enqueue([{ update_id: 41 }]);
    assert.equal(await queue.hasPending(), false);
  });
});

test("отказ чтения offset запрещает новый getUpdates до восстановления Redis", async () => {
  await fixture(async (queue, redis) => {
    await queue.enqueue([{ update_id: 10 }]);
    await disconnect(redis);
    const controller = new AbortController();
    let requests = 0, retries = 0;
    let observedOffset: number | undefined;
    await runPollingReceiver({ token: "fake-recovery-token", signal: controller.signal,
      queue, onUpdates: async () => {},
      wait: async () => {
        assert.equal(requests, 0);
        if (retries > 1) { controller.abort(); throw new Error("Повторное восстановление не ожидалось"); }
        retries++;
        await redis.connect();
      },
      request: async (_token, payload) => {
        requests++;
        observedOffset = (payload as { offset?: number }).offset;
        controller.abort();
        return { status: 200, body: { ok: true, result: [] } };
      },
    });
    assert.equal(retries, 1);
    assert.equal(requests, 1);
    assert.equal(observedOffset, 11);
    assert.equal((await queue.peek())?.update_id, 10);
  });
});

test("остановка во время сбоя записи завершает polling без подтверждения Telegram", async () => {
  const controller = new AbortController();
  let requests = 0, wakeups = 0, writes = 0;
  await runPollingReceiver({ token: "fake-recovery-token", signal: controller.signal,
    queue: { offset: async () => null, enqueue: async () => { writes++; throw new Error("Redis недоступен"); } },
    onUpdates: async () => { wakeups++; },
    wait: async () => { controller.abort(); },
    request: async () => { requests++; return { status: 200, body: { ok: true, result: [{ update_id: 5 }] } }; },
  });
  assert.equal(requests, 1);
  assert.equal(writes, 1);
  assert.equal(wakeups, 0);
});
