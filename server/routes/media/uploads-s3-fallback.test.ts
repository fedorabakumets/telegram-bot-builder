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

/** Объекты поддельного бакета */
const objects = new Map<string, string>([["3/2026-08-19/a.jpg", "jpeg-bytes"]]);

/** Поддельный S3-бэкенд хранилища загрузок */
const s3 = {
  backend: "s3",
  configId: "s3-uploads",
  get: async (key: string) => {
    const body = objects.get(key);
    if (body === undefined) throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
    return Readable.from([Buffer.from(body)]);
  },
} as unknown as StorageBackend;

/** ID хранилища загрузок, меняется в тестах */
let storageId: string | null = "s3-uploads";
let server: Server;
let base = "";

before(async () => {
  const app = express();
  app.use("/uploads", createUploadsS3Fallback({ storageId: () => storageId, listBackends: async () => [s3] }));
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
  it("отдаёт файл из бакета с типом по расширению", async () => {
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "image/jpeg");
    assert.strictEqual(await res.text(), "jpeg-bytes");
  });

  it("HEAD отвечает без тела", async () => {
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`, { method: "HEAD" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(await res.text(), "");
  });

  it("отсутствующий файл и выход из папки дают 404, а не SPA", async () => {
    assert.strictEqual((await fetch(`${base}/uploads/3/nope.jpg`)).status, 404);
    assert.strictEqual((await fetch(`${base}/uploads/3/..%2F..%2F.env`)).status, 404);
  });

  it("без UPLOADS_STORAGE_ID пропускает запрос дальше", async () => {
    storageId = null;
    const res = await fetch(`${base}/uploads/3/2026-08-19/a.jpg`);
    storageId = "s3-uploads";
    assert.strictEqual(await res.text(), "spa");
  });
});
