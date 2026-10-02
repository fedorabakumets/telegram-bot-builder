/**
 * @fileoverview Тесты переноса uploads/ в S3: заливка, пропуск, dry-run, удаление локальных копий
 * @module server/storage/migrate-uploads.test
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { existsSync } from "fs";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";

import { listUploadFiles, migrateUploads, type MigrationTarget } from "./migrate-uploads";

/** Временная папка загрузок для каждого теста */
let root = "";

/**
 * Поддельный бакет в памяти.
 * @returns Цель переноса и её содержимое
 */
function fakeTarget(): { target: MigrationTarget; objects: Map<string, Buffer> } {
  const objects = new Map<string, Buffer>();
  return {
    objects,
    target: {
      configId: "s3-uploads",
      head: async (key) => objects.get(key)?.length ?? null,
      put: async (key, data) => {
        objects.set(key, data);
      },
    },
  };
}

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "uploads-"));
  await mkdir(path.join(root, "3", "2026-08-19"), { recursive: true });
  await writeFile(path.join(root, "3", "2026-08-19", "a.jpg"), "aaaa");
  await writeFile(path.join(root, "3", "b.mp4"), "bb");
  await writeFile(path.join(root, "README.md"), "readme");
  await writeFile(path.join(root, "3", ".DS_Store"), "x");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("listUploadFiles", () => {
  it("берёт файлы проектов и пропускает корень и скрытые файлы", async () => {
    const files = await listUploadFiles(root);
    assert.deepStrictEqual(files.map((f) => f.key), ["3/2026-08-19/a.jpg", "3/b.mp4"]);
  });
});

describe("migrateUploads", () => {
  it("заливает файлы, обновляет записи и пропускает их при повторе", async () => {
    const { target, objects } = fakeTarget();
    const updated: string[] = [];
    const updateRows = async (key: string) => (updated.push(key), 1);

    const first = await migrateUploads({ rootDir: root, target, dryRun: false, deleteLocal: false, updateRows });
    assert.strictEqual(first.uploaded, 2);
    assert.strictEqual(first.rowsUpdated, 2);
    assert.strictEqual(objects.get("3/b.mp4")?.toString(), "bb");

    const second = await migrateUploads({ rootDir: root, target, dryRun: false, deleteLocal: false, updateRows });
    assert.strictEqual(second.uploaded, 0);
    assert.strictEqual(second.skipped, 2);
    assert.ok(existsSync(path.join(root, "3", "b.mp4")));
  });

  it("в dry-run ничего не пишет", async () => {
    const { target, objects } = fakeTarget();
    let calls = 0;
    const res = await migrateUploads({
      rootDir: root, target, dryRun: true, deleteLocal: true, updateRows: async () => ++calls,
    });
    assert.strictEqual(res.uploaded, 2);
    assert.strictEqual(objects.size, 0);
    assert.strictEqual(calls, 0);
    assert.ok(existsSync(path.join(root, "3", "b.mp4")));
  });

  it("удаляет локальный файл только после проверки копии", async () => {
    const { target } = fakeTarget();
    const broken: MigrationTarget = { ...target, put: async () => {} };
    const bad = await migrateUploads({ rootDir: root, target: broken, dryRun: false, deleteLocal: true, updateRows: async () => 0 });
    assert.strictEqual(bad.failed, 2);
    assert.ok(existsSync(path.join(root, "3", "b.mp4")));

    const ok = await migrateUploads({ rootDir: root, target, dryRun: false, deleteLocal: true, updateRows: async () => 0 });
    assert.strictEqual(ok.deleted, 2);
    assert.ok(!existsSync(path.join(root, "3", "b.mp4")));
  });
});
