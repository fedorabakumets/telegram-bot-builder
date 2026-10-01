/**
 * @fileoverview Тесты списка баз для бэкапа по расписанию и проверки устаревшего бэкапа
 * @module server/database/backups/dbBackupTargets.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import type { DbBackupEntry } from "./dbBackupIndex";
import { getDbBackupTargets, parseDbBackupTargets, staleBackupWarning } from "./dbBackupTargets";

/**
 * Запись бэкапа с заданным временем
 * @param createdAt - Время создания (ISO)
 * @returns запись индекса
 */
function entry(createdAt: string): DbBackupEntry {
  return { id: createdAt, key: "k", size: 1, sha256: "", createdAt, serverVersion: "18", tables: {} } as DbBackupEntry;
}

describe("parseDbBackupTargets", () => {
  it("разбирает пары через пробел, перевод строки и ;", () => {
    const targets = parseDbBackupTargets("bots=postgresql://u:p@h:1/db?sslmode=require;\nother=postgresql://x");
    assert.deepStrictEqual(targets.map((t) => t.label), ["bots", "other"]);
    assert.strictEqual(targets[0].databaseUrl, "postgresql://u:p@h:1/db?sslmode=require");
  });

  it("пустое значение — пустой список", () => {
    assert.deepStrictEqual(parseDbBackupTargets(undefined), []);
  });

  it("отклоняет пару без адреса и недопустимую метку", () => {
    assert.throws(() => parseDbBackupTargets("bots="), /метка=адрес/);
    assert.throws(() => parseDbBackupTargets("бот=postgresql://x"), /Недопустимая метка/);
  });
});

describe("getDbBackupTargets", () => {
  it("ставит базу панели первой и запрещает повтор метки", () => {
    const env = { DATABASE_URL: "postgresql://panel", DB_BACKUP_TARGETS: "bots=postgresql://bots" };
    assert.deepStrictEqual(getDbBackupTargets(env).map((t) => t.label), ["panel", "bots"]);
    assert.throws(() => getDbBackupTargets({ ...env, DB_BACKUP_TARGETS: "panel=postgresql://x" }), /повторяется/);
  });
});

describe("staleBackupWarning", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("молчит, пока бэкап не старше двух интервалов", () => {
    assert.strictEqual(staleBackupWarning([entry("2026-10-01T10:30:00Z")], 1, now), null);
  });

  it("предупреждает об устаревшем бэкапе и об их отсутствии", () => {
    assert.match(staleBackupWarning([entry("2026-10-01T09:00:00Z")], 1, now) ?? "", /3\.0 ч/);
    assert.strictEqual(staleBackupWarning([], 1, now), "бэкапов ещё нет");
  });
});
