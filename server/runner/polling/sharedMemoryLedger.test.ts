/** @fileoverview Проверки однократного учёта общей памяти и отсутствия выдуманного RSS на бота. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SharedMemoryLedger } from "./sharedMemoryLedger";

test("два бота в одном процессе дают один общий RSS", () => {
  const published: number[] = [];
  const ledger = new SharedMemoryLedger(value => published.push(value));
  const runtime = ledger.register(100);
  runtime.setHandlers([30, 31, 31]);
  runtime.record(100_000);
  assert.equal(ledger.total(), 100_000);
  assert.deepEqual(ledger.snapshot(), [{ memoryScope: "shared", actualPid: 100,
    memoryKb: 100_000, handlerCount: 2, handlerTokenIds: [30, 31] }]);
  runtime.setHandlers([]);
  assert.equal(ledger.total(), 100_000);
  assert.equal(ledger.snapshot()[0].handlerCount, 0);
  runtime.close(); runtime.record(999_999); runtime.close();
  assert.equal(published.at(-1), 0);
});

test("повторные регистрации одного PID не удваивают RSS, разные PID складываются", () => {
  const ledger = new SharedMemoryLedger(() => {});
  const first = ledger.register(100), duplicate = ledger.register(100), second = ledger.register(200);
  first.setHandlers([30]); duplicate.setHandlers([31]);
  first.record(100_000); duplicate.record(110_000); second.record(50_000);
  assert.equal(ledger.total(), 160_000);
  assert.equal(ledger.snapshot()[0].handlerCount, 2);
  first.record(115_000);
  assert.equal(ledger.total(), 165_000);
  duplicate.close();
  assert.equal(ledger.total(), 165_000);
});

test("неизвестный PID и некорректные кадры не создают измеренную память", () => {
  const ledger = new SharedMemoryLedger(() => {});
  const runtime = ledger.register();
  runtime.record(100_000);
  assert.equal(ledger.total(), 0);
  runtime.record(100_000, 101);
  for (const bad of ["10", -1, NaN, Infinity, null, 1.5]) runtime.record(bad);
  runtime.record(200_000, "102");
  runtime.setHandlers([30, NaN, -1, 1.5, 30]);
  assert.equal(ledger.total(), 100_000);
  assert.deepEqual(ledger.snapshot()[0].handlerTokenIds, [30]);
});

/** Проверяет, что завершённая жизнь процесса не изменяет замер следующего пробуждения. */
test("запоздалые кадры завершённой жизни не воскрешают RSS и обработчики", () => {
  const published: number[] = [];
  const ledger = new SharedMemoryLedger(value => published.push(value));
  const previous = ledger.register(101);
  previous.setHandlers([30]); previous.record(90_000); previous.close();
  const current = ledger.register(202);
  current.setHandlers([31]); current.record(95_000);
  previous.record(999_999, 202); previous.setHandlers([30]); previous.close();
  assert.equal(ledger.total(), 95_000);
  assert.equal(published.at(-1), 95_000);
  assert.deepEqual(ledger.snapshot(), [{ memoryScope: "shared", actualPid: 202,
    memoryKb: 95_000, handlerCount: 1, handlerTokenIds: [31] }]);
  current.close();
  assert.equal(ledger.total(), 0);
});

/** Отсутствие сценариев само по себе не доказывает завершение общего интерпретатора. */
test("пустой список сценариев сохраняет RSS до закрытия регистрации процесса", () => {
  const ledger = new SharedMemoryLedger(() => {});
  const runtime = ledger.register(101);
  runtime.record(90_000); runtime.setHandlers([30, 31]); runtime.setHandlers([]);
  assert.equal(ledger.total(), 90_000);
  assert.equal(ledger.snapshot()[0].handlerCount, 0);
  runtime.close();
  assert.deepEqual(ledger.snapshot(), []);
});
