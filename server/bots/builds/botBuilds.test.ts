/**
 * @fileoverview Тесты сохранения, восстановления и чистки сборок ботов (без БД)
 * @module server/bots/builds/botBuilds.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BotBuild, InsertBotBuild } from "@shared/schema";
import { LocalDiskBackend } from "../../storage/local-disk-backend";
import { buildBotBuildKey } from "./botBuildKey";
import type { BotBuildDeps } from "./botBuildDeps";
import { restoreBotBuild } from "./restoreBotBuild";
import { saveBotBuild } from "./saveBotBuild";

const FP = (n: number) => n.toString(16).padStart(64, "0");

/**
 * Создаёт зависимости поверх массива в памяти и локальной папки.
 * @param root - Временная папка хранилища
 * @returns Зависимости и доступ к строкам
 */
function createMemoryDeps(root: string): { deps: BotBuildDeps; rows: BotBuild[] } {
  const rows: BotBuild[] = [];
  const backend = new LocalDiskBackend({ configId: "test-local", name: "test", readOnly: false, rootPath: root });
  let nextId = 1;
  const deps: BotBuildDeps = {
    findBuild: async (tokenId, fp) => rows.find((r) => r.tokenId === tokenId && r.fingerprint === fp) ?? null,
    insertBuild: async (build: InsertBotBuild) => {
      if (rows.some((r) => r.tokenId === build.tokenId && r.fingerprint === build.fingerprint)) return false;
      rows.push({ ...build, id: nextId, createdAt: new Date(Date.now() + nextId++) } as BotBuild);
      return true;
    },
    listBuilds: async (tokenId) =>
      rows.filter((r) => r.tokenId === tokenId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    deleteBuilds: async (ids) => {
      for (const id of ids) rows.splice(rows.findIndex((r) => r.id === id), 1);
    },
    getWritableBackend: async () => backend,
    resolveBackend: async (configId) => (configId === backend.configId ? backend : null),
  };
  return { deps, rows };
}

/**
 * Пишет файл бота во временную папку.
 * @param dir - Папка
 * @param code - Содержимое
 * @returns Путь к файлу
 */
function writeBot(dir: string, code: string): string {
  const file = join(dir, "bot.py");
  writeFileSync(file, code);
  return file;
}

describe("bot builds", () => {
  it("сохраняет сборку и восстанавливает тот же код после удаления файла", async () => {
    const root = mkdtempSync(join(tmpdir(), "builds-"));
    const { deps, rows } = createMemoryDeps(join(root, "store"));
    const mainFile = writeBot(root, "print('привет')\n");
    const input = { projectId: 1, tokenId: 2, fingerprint: FP(1), generatorVersion: "v1", mainFile, keep: 3 };

    assert.strictEqual(await saveBotBuild(input, deps), "saved");
    assert.strictEqual(rows.length, 1);
    assert.ok(existsSync(join(root, "store", buildBotBuildKey(1, 2, FP(1)))));

    const target = join(root, "fresh", "bot.py");
    assert.strictEqual(await restoreBotBuild({ tokenId: 2, fingerprint: FP(1), mainFile: target }, deps), true);
    assert.strictEqual(readFileSync(target, "utf8"), "print('привет')\n");
  });

  it("повторное сохранение с тем же отпечатком ничего не пишет", async () => {
    const root = mkdtempSync(join(tmpdir(), "builds-"));
    const { deps, rows } = createMemoryDeps(join(root, "store"));
    const mainFile = writeBot(root, "x = 1\n");
    const input = { projectId: 1, tokenId: 2, fingerprint: FP(1), generatorVersion: "v1", mainFile, keep: 3 };
    await saveBotBuild(input, deps);
    assert.strictEqual(await saveBotBuild(input, deps), "exists");
    assert.strictEqual(rows.length, 1);
  });

  it("оставляет только последние keep сборок и удаляет их объекты", async () => {
    const root = mkdtempSync(join(tmpdir(), "builds-"));
    const store = join(root, "store");
    const { deps, rows } = createMemoryDeps(store);
    const mainFile = writeBot(root, "x = 1\n");
    for (let i = 1; i <= 4; i++) {
      await saveBotBuild({ projectId: 1, tokenId: 2, fingerprint: FP(i), generatorVersion: "v1", mainFile, keep: 2 }, deps);
    }
    assert.deepStrictEqual(rows.map((r) => r.fingerprint).sort(), [FP(3), FP(4)]);
    assert.ok(!existsSync(join(store, buildBotBuildKey(1, 2, FP(1)))));
    assert.ok(existsSync(join(store, buildBotBuildKey(1, 2, FP(4)))));
  });

  it("нет сборки — false; повреждённая сборка — ошибка", async () => {
    const root = mkdtempSync(join(tmpdir(), "builds-"));
    const store = join(root, "store");
    const { deps } = createMemoryDeps(store);
    const target = join(root, "out", "bot.py");
    assert.strictEqual(await restoreBotBuild({ tokenId: 2, fingerprint: FP(9), mainFile: target }, deps), false);

    const mainFile = writeBot(root, "x = 1\n");
    await saveBotBuild({ projectId: 1, tokenId: 2, fingerprint: FP(1), generatorVersion: "v1", mainFile, keep: 3 }, deps);
    writeFileSync(join(store, buildBotBuildKey(1, 2, FP(1))), Buffer.from("not gzip"));
    await assert.rejects(restoreBotBuild({ tokenId: 2, fingerprint: FP(1), mainFile: target }, deps));
    assert.ok(!existsSync(target));
  });

  it("ключ отвергает некорректный отпечаток", () => {
    assert.throws(() => buildBotBuildKey(1, 2, "../../etc/passwd"));
    assert.throws(() => buildBotBuildKey(0, 2, FP(1)));
  });
});
