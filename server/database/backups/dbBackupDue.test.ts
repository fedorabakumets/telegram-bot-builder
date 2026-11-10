/** @fileoverview Проверки сохранённого расписания без дампов, БД и подключения к хранилищу. */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { StorageBackend } from "../../storage/storage-backend";
import type { DbBackupEntry, DbBackupIndex } from "./dbBackupIndex";
import { isDbBackupDue, runDueDbBackup } from "./dbBackupDue";

/** Условный backend без сетевых операций. */
const backend = { configId: "test" } as StorageBackend;

/**
 * Создаёт минимальную запись индекса для проверки срока.
 * @param createdAt - Время успешного завершения
 * @returns Запись успешной копии
 */
function entry(createdAt: string): DbBackupEntry {
  return { id: createdAt, createdAt, key: "test.dump", size: 1, sha256: "", serverVersion: "16", tables: {} };
}

test("свежая копия переживает рестарт, просроченная наступает точно на границе", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  assert.equal(isDbBackupDue([entry("2026-11-09T12:00:00.001Z")], 24, now), false);
  assert.equal(isDbBackupDue([entry("2026-11-09T12:00:00Z")], 24, now), true);
  assert.equal(isDbBackupDue([entry("2026-11-08T12:00:00Z")], 24, now), true);
});

test("пустой индекс вызывает бэкап, некорректные даты возвращают ошибку", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  assert.equal(isDbBackupDue([], 24, now), true);
  assert.throws(() => isDbBackupDue([entry("invalid")], 24, now));
  assert.throws(() => isDbBackupDue([entry("2027-01-01T00:00:00Z")], 24, now));
  assert.equal(isDbBackupDue([entry("2026-11-10T12:01:00Z")], 24, now), false);
});

test("выбирается самая новая успешная копия независимо от порядка записей", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  const entries = [entry("2026-11-01T00:00:00Z"), entry("2026-11-10T11:00:00Z")];
  assert.equal(isDbBackupDue(entries, 24, now), false);
  assert.equal(isDbBackupDue(entries.reverse(), 24, now), false);
});

test("индексы разных меток независимы; свежая цель не вызывает создание", async () => {
  const created: string[] = [];
  /** Возвращает копию только для первой метки. */
  const read = async (_backend: StorageBackend, label: string): Promise<DbBackupIndex> => ({
    label, entries: label === "panel" ? [entry(new Date().toISOString())] : [],
  });
  for (const label of ["panel", "bots"]) {
    await runDueDbBackup(backend, label, 24, async () => { created.push(label); }, read);
  }
  assert.deepEqual(created, ["bots"]);
});

test("ошибка индекса не запускает дамп; следующая проверка может повториться", async () => {
  let created = 0;
  /** Считает запуски вместо создания настоящего дампа. */
  const create = async () => { created++; };
  await assert.rejects(runDueDbBackup(backend, "panel", 24, create, async () => { throw new Error("storage"); }));
  assert.equal(created, 0);
  assert.equal(await runDueDbBackup(backend, "panel", 24, create, async () => ({ label: "panel", entries: [] })), true);
  assert.equal(created, 1);
});

test("неудачная копия не сохраняет ложный срок и повторяется", async () => {
  let attempts = 0;
  /** Читает неизменённый индекс без успешных копий. */
  const read = async (): Promise<DbBackupIndex> => ({ label: "panel", entries: [] });
  /** Первая попытка завершается ошибкой. */
  const create = async () => { if (++attempts === 1) throw new Error("dump"); };
  await assert.rejects(runDueDbBackup(backend, "panel", 24, create, read));
  assert.equal(await runDueDbBackup(backend, "panel", 24, create, read), true);
  assert.equal(attempts, 2);
});
