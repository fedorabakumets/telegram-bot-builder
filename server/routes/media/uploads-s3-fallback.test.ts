/**
 * @fileoverview Тесты запасной раздачи /uploads из S3 на настоящем Express
 * @module server/routes/media/uploads-s3-fallback.test
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { Readable } from "stream";

import express from "express";

import type { StorageBackend } from "../../storage/storage-backend";
import { createUploadsS3Fallback } from "./uploads-s3-fallback";

/** Объекты поддельного бакета, включая незарегистрированный бэкап */
const objects = new Map<string, string>([
  ["3/2026-08-19/a.jpg", "jpeg-bytes"],
  ["backups/nightly.tar", "backup-bytes"],
]);

/** Ключи, которые обработчик реально прочитал из бакета */
const fetched: string[] = [];

/** Поддельный S3-бэкенд хранилища загрузок */
const s3 = {
  backend: "s3",
  configId: "s3-uploads",
  get: async (key: string) => {
    fetched.push(key);
    const body = objects.get(key);
    if (body === undefined) throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
    return Readable.from([Buffer.from(body)]);
  },
} as unknown as StorageBackend;

/** Зарегистрированные ключи media_files: путь → projectId */
const registered = new Map<string, number>([["3/2026-08-19/a.jpg", 3]]);

/** ID хранилища загрузок, меняется в тестах */
let storageId: string | null = "s3-uploads";
let server: Server;
let base = "";

before(async () => {
  const app = express();
  app.use("/uploads", createUploadsS3Fallback({
    storageId: () => storageId,
    listBackends: async () => [s3],
    findMedia: async (configId, filePath) => {
      if (configId !== "s3-uploads") return null;
      const projectId = registered.get(filePath);
      return projectId === undefined ? null : { projectId };
    },
  }));
  app.use((_req, res) => res.status(200).send("spa"));
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

describe("createUploadsS3Fallback", () => {
  it("зарегистрированный ключ отдаётся без сессии", async () => {
    fetched.length = 0;
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "image/jpeg");
    assert.strictEqual(res.headers.get("cache-control"), "public, max-age=86400");
    assert.strictEqual(await res.text(), "jpeg-bytes");
    assert.deepStrictEqual(fetched, ["3/2026-08-19/a.jpg"]);
  });

  it("HEAD зарегистрированного файла отвечает без тела", async () => {
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`, { method: "HEAD" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(await res.text(), "");
  });

  it("незарегистрированный ключ — 404, бакет не читается", async () => {
    fetched.length = 0;
    const res = await fetch(`${base}/uploads/backups/nightly.tar`);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(await res.text(), "");
    assert.deepStrictEqual(fetched, []);
  });

  it("выход из папки по-прежнему 404", async () => {
    fetched.length = 0;
    const res = await fetch(`${base}/uploads/3/..%2F..%2F.env`);
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(fetched, []);
  });

  it("без UPLOADS_STORAGE_ID пропускает запрос дальше", async () => {
    storageId = null;
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`);
    storageId = "s3-uploads";
    assert.strictEqual(await res.text(), "spa");
  });
});
