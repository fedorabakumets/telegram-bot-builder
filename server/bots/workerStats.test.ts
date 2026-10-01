/**
 * @fileoverview Тесты сбора статистики Worker Pool, включая общий воркер
 * @module server/bots/workerStats.test
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import { collectWorkerStats, splitMemoryByBots, type WorkerStatsSource } from "./workerStats";

/**
 * Создаёт воркер для теста
 * @param key - Ключ воркера
 * @param tokens - ID токенов ботов
 * @param pid - PID процесса
 * @returns источник статистики
 */
function worker(key: number, tokens: number[], pid = 100 + key): WorkerStatsSource {
  return { projectId: key, activeBots: new Set(tokens), process: { pid } };
}

/** Чтение памяти по PID: 132 МБ для общего воркера, иначе 70 */
const readMemory = (pid: number | undefined) => (pid === 100 ? 132 : 70);

describe("splitMemoryByBots", () => {
  it("делит пропорционально числу ботов, сумма долей равна RSS", () => {
    const shares = splitMemoryByBots(100, new Map([[1, 1], [2, 2]]));
    assert.deepStrictEqual([...shares.entries()], [[1, 33], [2, 67]]);
  });

  it("без ботов — пустая разбивка", () => {
    assert.strictEqual(splitMemoryByBots(100, new Map()).size, 0);
  });
});

describe("collectWorkerStats", () => {
  it("воркер на проект — одна строка с полным RSS", () => {
    const stats = collectWorkerStats([worker(5, [11, 12])], () => 5, readMemory);
    assert.deepStrictEqual(stats.details, [
      { projectId: 5, botsCount: 2, memoryMb: 70, pid: 105, workerKey: 5, shared: false },
    ]);
    assert.strictEqual(stats.workers, 1);
    assert.strictEqual(stats.totalMemoryMb, 70);
  });

  it("общий воркер раскладывается по проектам токенов", () => {
    const projectOfToken = new Map([[1, 1], [2, 2]]);
    const stats = collectWorkerStats([worker(0, [1, 2])], (t) => projectOfToken.get(t) ?? 0, readMemory);
    assert.deepStrictEqual(
      stats.details.map((d) => [d.projectId, d.botsCount, d.memoryMb, d.workerKey, d.shared]),
      [[1, 1, 66, 0, true], [2, 1, 66, 0, true]],
    );
    assert.strictEqual(stats.workers, 1);
    assert.strictEqual(stats.totalBots, 2);
    assert.strictEqual(stats.totalMemoryMb, 132);
  });

  it("общий воркер с ботами одного проекта не теряется (проект ≠ ключ 0)", () => {
    const stats = collectWorkerStats([worker(0, [7])], () => 3, readMemory);
    assert.deepStrictEqual(
      stats.details.map((d) => [d.projectId, d.botsCount, d.memoryMb, d.shared]),
      [[3, 1, 132, true]],
    );
  });

  it("общий воркер без ботов (drain) не даёт строк, но учитывается в агрегатах", () => {
    const stats = collectWorkerStats([worker(0, [])], () => 0, readMemory);
    assert.deepStrictEqual(stats.details, []);
    assert.strictEqual(stats.workers, 1);
  });

  describe("режим owner (ключ воркера — ID владельца)", () => {
    before(() => {
      process.env.WORKER_GROUPING = "owner";
    });
    after(() => {
      delete process.env.WORKER_GROUPING;
    });

    it("один проект владельца — строка с ID проекта и полным RSS", () => {
      const stats = collectWorkerStats([worker(1612141295, [4], 7)], () => 9, readMemory);
      assert.deepStrictEqual(
        stats.details.map((d) => [d.projectId, d.botsCount, d.memoryMb, d.shared]),
        [[9, 1, 70, false]],
      );
    });

    it("два проекта владельца — разбивка, сумма равна RSS процесса", () => {
      const projectOfToken = new Map([[1, 10], [2, 11], [3, 11]]);
      const stats = collectWorkerStats([worker(55, [1, 2, 3], 7)], (t) => projectOfToken.get(t) ?? 0, readMemory);
      assert.deepStrictEqual(
        stats.details.map((d) => [d.projectId, d.botsCount, d.memoryMb, d.shared]),
        [[10, 1, 23, true], [11, 2, 47, true]],
      );
    });

    it("пустой воркер владельца не приписывается проекту с ID владельца", () => {
      const stats = collectWorkerStats([worker(55, [], 7)], () => 0, readMemory);
      assert.deepStrictEqual(stats.details, []);
    });
  });
});
