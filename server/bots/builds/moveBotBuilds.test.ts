/**
 * @fileoverview Тесты переноса сборок между хранилищами (без БД)
 * @module server/bots/builds/moveBotBuilds.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BotBuild } from "@shared/schema";
import { LocalDiskBackend } from "../../storage/local-disk-backend";
import { buildBotBuildKey } from "./botBuildKey";
import { packBotBuild } from "./botBuildCodec";
import { moveBotBuilds, type MoveBotBuildsDeps } from "./moveBotBuilds";

const FP = (n: number) => n.toString(16).padStart(64, "0");

/**
 * Готовит два хранилища и сборки в исходном.
 * @param count - Сколько сборок положить в исходное хранилище
 * @returns Зависимости, строки и пути хранилищ
 */
async function setup(count: number) {
  const root = mkdtempSync(join(tmpdir(), "move-builds-"));
  const src = new LocalDiskBackend({ configId: "src", name: "src", readOnly: false, rootPath: join(root, "src") });
  const dst = new LocalDiskBackend({ configId: "dst", name: "dst", readOnly: false, rootPath: join(root, "dst") });
  const rows: BotBuild[] = [];
  for (let i = 1; i <= count; i++) {
    const packed = packBotBuild(Buffer.from(`code ${i}`));
    const objectKey = buildBotBuildKey(1, 2, FP(i));
    await src.put(objectKey, packed.data, "application/gzip");
    rows.push({
      id: i, projectId: 1, tokenId: 2, fingerprint: FP(i), storageConfigId: "src", objectKey,
      fileName: "bot.py", size: packed.size, sha256: packed.sha256, generatorVersion: "v1", createdAt: new Date(),
    });
  }
  const backends: Record<string, LocalDiskBackend> = { src, dst };
  const deps: MoveBotBuildsDeps = {
    listOutside: async (id) => rows.filter((r) => r.storageConfigId !== id),
    setStorage: async (id, configId) => {
      rows.find((r) => r.id === id)!.storageConfigId = configId;
    },
    resolveBackend: async (id) => backends[id] ?? null,
  };
  return { deps, rows, root };
}

describe("moveBotBuilds", () => {
  it("переносит сборки, переключает строки и удаляет исходники", async () => {
    const { deps, rows, root } = await setup(2);
    const result = await moveBotBuilds("dst", deps);
    assert.deepStrictEqual(result, { moved: 2, failed: 0, total: 2 });
    assert.ok(rows.every((r) => r.storageConfigId === "dst"));
    for (const r of rows) {
      assert.ok(existsSync(join(root, "dst", r.objectKey)));
      assert.ok(!existsSync(join(root, "src", r.objectKey)));
    }
    assert.deepStrictEqual(await moveBotBuilds("dst", deps), { moved: 0, failed: 0, total: 0 });
  });

  it("dry-run ничего не меняет, keepSource оставляет исходник", async () => {
    const { deps, rows, root } = await setup(1);
    await moveBotBuilds("dst", deps, { dryRun: true });
    assert.strictEqual(rows[0].storageConfigId, "src");
    await moveBotBuilds("dst", deps, { keepSource: true });
    assert.strictEqual(rows[0].storageConfigId, "dst");
    assert.ok(existsSync(join(root, "src", rows[0].objectKey)));
  });

  it("повреждённая сборка не переносится и строка остаётся на месте", async () => {
    const { deps, rows, root } = await setup(1);
    writeFileSync(join(root, "src", rows[0].objectKey), "broken");
    const result = await moveBotBuilds("dst", deps);
    assert.deepStrictEqual(result, { moved: 0, failed: 1, total: 1 });
    assert.strictEqual(rows[0].storageConfigId, "src");
    assert.ok(!existsSync(join(root, "dst", rows[0].objectKey)));
  });

  it("неизвестное целевое хранилище — ошибка", async () => {
    const { deps } = await setup(0);
    await assert.rejects(moveBotBuilds("nope", deps));
  });
});
