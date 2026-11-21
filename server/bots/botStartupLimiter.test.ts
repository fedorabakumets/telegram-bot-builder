/** @fileoverview Проверки общего предела и интервала между началами запусков любых проектов. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import { BotStartupLimiter } from "./botStartupLimiter";

test("пять запусков одного проекта допускаются вместе, шестой ждёт освобождения", async () => {
  const limiter = new BotStartupLimiter(5, 0);
  const releases = await Promise.all(Array.from({ length: 5 }, () => limiter.acquire(1)));
  let sixthStarted = false;
  const sixth = limiter.acquire(1).then(release => { sixthStarted = true; return release; });
  await delay(10); assert.equal(sixthStarted, false);
  releases[0](); releases[0]();
  (await sixth)(); for (const release of releases) release();
});

test("интервал250мс глобальный между допусками и не ждёт завершения запуска", async () => {
  const limiter = new BotStartupLimiter();
  const starts: number[] = [];
  const tasks = [1, 1, 2, 1].map(async project => {
    const release = await limiter.acquire(project);
    starts.push(performance.now()); return release;
  });
  const releases = await Promise.all(tasks);
  assert.equal(starts.length, 4);
  // Все четыре места удерживались: ожидание завершения предыдущего вызвало бы зависание.
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 245);
  for (const release of releases) release();
});

test("долгий занятый пул освобождается без дополнительной паузы от завершения", async () => {
  const limiter = new BotStartupLimiter(1, 30);
  const first = await limiter.acquire(1);
  const second = limiter.acquire(2);
  await delay(60);
  const released = performance.now(); first(); (await second)();
  assert.ok(performance.now() - released < 25);
});

test("массовая очередь сохраняет глобальный предел и порядок любых проектов", async () => {
  const limiter = new BotStartupLimiter(5, 0);
  let active = 0, maximum = 0;
  const order: number[] = [];
  await Promise.all(Array.from({ length: 32 }, async (_, index) => {
    const release = await limiter.acquire(index % 3 + 1);
    try {
      order.push(index); active++; maximum = Math.max(maximum, active);
      await delay(2);
    } finally { active--; release(); }
  }));
  assert.equal(maximum, 5); assert.equal(active, 0);
  assert.deepEqual(order, Array.from({ length: 32 }, (_, index) => index));
});

test("ошибка с освобождением в finally не задерживает очередь", async () => {
  const limiter = new BotStartupLimiter(1, 0);
  await assert.rejects((async () => {
    const release = await limiter.acquire(1);
    try { throw new Error("ошибка запуска"); } finally { release(); }
  })());
  (await limiter.acquire(1))();
  await assert.rejects(limiter.acquire(0));
});
