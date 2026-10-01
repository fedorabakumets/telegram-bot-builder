/**
 * @fileoverview Тесты бэкапов базы: настройки, список в хранилище, ротация, проверка строк
 * @module server/database/backups/dbBackups.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { LocalDiskBackend } from "../../storage/local-disk-backend";
import { assertBackupLabel, getDbBackupIntervalHours, getDbBackupsKeep } from "./dbBackupConfig";
import {
  backupIdFromDate, backupKey, findBackup, readBackupIndex, splitForRetention, writeBackupIndex, type DbBackupEntry,
} from "./dbBackupIndex";
import { adaptScriptForServer, splitConnectionPassword } from "./pgDumpRestore";
import { compareRowCounts } from "./tableRowCounts";

/**
 * Создаёт запись бэкапа для тестов.
 * @param id - ID бэкапа
 * @returns Запись бэкапа
 */
function entry(id: string): DbBackupEntry {
  return { id, key: backupKey("panel", id), size: 1, sha256: "x", createdAt: "", serverVersion: "16", tables: {} };
}

describe("dbBackups", () => {
  it("настройки: значения по умолчанию и защита от мусора", () => {
    assert.strictEqual(getDbBackupsKeep({}), 7);
    assert.strictEqual(getDbBackupsKeep({ DB_BACKUPS_KEEP: "0" }), 7);
    assert.strictEqual(getDbBackupsKeep({ DB_BACKUPS_KEEP: "3" }), 3);
    assert.strictEqual(getDbBackupIntervalHours({}), 0);
    assert.strictEqual(getDbBackupIntervalHours({ DB_BACKUP_INTERVAL_HOURS: "24" }), 24);
  });

  it("метка: только латиница, цифры, - и _", () => {
    assert.strictEqual(assertBackupLabel("railway-tbb_bots"), "railway-tbb_bots");
    assert.throws(() => assertBackupLabel("../etc"));
    assert.throws(() => assertBackupLabel("база"));
    assert.throws(() => assertBackupLabel(""));
  });

  it("ID бэкапа из времени UTC", () => {
    assert.strictEqual(backupIdFromDate(new Date("2026-10-01T14:05:01.123Z")), "20261001-140501");
  });

  it("ротация оставляет последние N, даже если порядок перепутан", () => {
    const { kept, dropped } = splitForRetention([entry("20261001-1"), entry("20261003-1"), entry("20261002-1")], 2);
    assert.deepStrictEqual(kept.map((e) => e.id), ["20261003-1", "20261002-1"]);
    assert.deepStrictEqual(dropped.map((e) => e.id), ["20261001-1"]);
  });

  it("список бэкапов пишется и читается из хранилища; нет файла — пустой список", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "db-backups-"));
    try {
      const backend = new LocalDiskBackend({ configId: "t", name: "t", readOnly: false, rootPath: dir });
      assert.deepStrictEqual((await readBackupIndex(backend, "panel")).entries, []);
      await writeBackupIndex(backend, { label: "panel", entries: [entry("b"), entry("a")] });
      const index = await readBackupIndex(backend, "panel");
      assert.strictEqual(findBackup(index, "latest")?.id, "b");
      assert.strictEqual(findBackup(index, "a")?.key, "db-backups/panel/a.dump");
      assert.strictEqual(findBackup(index, "zzz"), null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("пароль отделяется от строки подключения", () => {
    const split = splitConnectionPassword("postgresql://u:p%40ss@host:5432/db?sslmode=require");
    assert.strictEqual(split.password, "p@ss");
    assert.strictEqual(split.url, "postgresql://u@host:5432/db?sslmode=require");
    assert.strictEqual(splitConnectionPassword("postgresql://u@host/db").password, null);
  });

  it("SET transaction_timeout убирается только для серверов до 17", () => {
    const script = "SET lock_timeout = 0;\nSET transaction_timeout = 0;\nSET client_encoding = 'UTF8';\n";
    assert.strictEqual(adaptScriptForServer(script, 16), "SET lock_timeout = 0;\n\nSET client_encoding = 'UTF8';\n");
    assert.strictEqual(adaptScriptForServer(script, 17), script);
  });

  it("сверка строк находит расхождения и пропавшие таблицы", () => {
    const mismatches = compareRowCounts({ "public.a": 2, "public.b": 0, "public.c": 5 }, { "public.a": 2, "public.c": 4 });
    assert.deepStrictEqual(mismatches, [
      { table: "public.b", expected: 0, actual: null },
      { table: "public.c", expected: 5, actual: 4 },
    ]);
  });
});
