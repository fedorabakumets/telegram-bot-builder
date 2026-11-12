/** @fileoverview Проверки точного сложения RSS и удаления измерений завершённых обработчиков. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ChildMemoryLedger } from "./memoryLedger";

test("RSS двух обработчиков складывается числами и обнуляется после последнего выхода", () => {
  const values: number[] = [];
  const ledger = new ChildMemoryLedger(value => values.push(value));
  const first = ledger.register(1);
  const second = ledger.register(2);
  first.record(1024); second.record(2048);
  assert.equal(values[values.length - 1], 3072);
  first.record(1536);
  assert.equal(ledger.total(), 3584);
  first.close();
  assert.equal(values[values.length - 1], 2048);
  second.close();
  assert.equal(values[values.length - 1], 0);
  assert.deepEqual(ledger.snapshot(), []);
});

test("ошибка до готовности очищает измерение, повторные close и поздние кадры безопасны", () => {
  const values: number[] = [];
  const ledger = new ChildMemoryLedger(value => values.push(value));
  const failed = ledger.register(1);
  failed.record(42000);
  failed.close(); failed.close(); failed.record(90000);
  assert.deepEqual(values, [42000, 0]);
  const restarted = ledger.register(1);
  restarted.record(12000);
  failed.record(99999);
  assert.equal(ledger.total(), 12000);
  assert.deepEqual(ledger.snapshot(), [{ tokenId: 1, memoryKb: 12000 }]);
});

test("некорректные значения памяти не превращаются в строки или отрицательные итоги", () => {
  const ledger = new ChildMemoryLedger(() => {});
  const child = ledger.register(3);
  child.record(100);
  for (const value of ["200", -1, NaN, Infinity, null, {}, 1.5]) child.record(value);
  assert.equal(ledger.total(), 100);
});
