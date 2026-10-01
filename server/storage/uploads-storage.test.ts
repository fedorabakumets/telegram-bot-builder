/**
 * @fileoverview Тесты хранилища загрузок: ID из окружения, разбор ключей, Content-Type
 * @module server/storage/uploads-storage.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";

import type { StorageBackend } from "./storage-backend";
import {
  contentTypeForKey,
  findUploadsBackend,
  getUploadsStorageId,
  uploadKeyFromPath,
  uploadKeyFromUrl,
} from "./uploads-storage";

describe("getUploadsStorageId", () => {
  it("пустое значение выключает запасное чтение", () => {
    assert.strictEqual(getUploadsStorageId({}), null);
    assert.strictEqual(getUploadsStorageId({ UPLOADS_STORAGE_ID: "  " }), null);
    assert.strictEqual(getUploadsStorageId({ UPLOADS_STORAGE_ID: " s3-uploads " }), "s3-uploads");
  });
});

describe("uploadKeyFromPath", () => {
  it("декодирует путь и убирает лишние слеши", () => {
    assert.strictEqual(uploadKeyFromPath("/3/2026-08-19/a%20b.jpg"), "3/2026-08-19/a b.jpg");
    assert.strictEqual(uploadKeyFromPath("//3//x.png"), "3/x.png");
  });

  it("отклоняет выход из папки и мусор", () => {
    assert.strictEqual(uploadKeyFromPath("/../.env"), null);
    assert.strictEqual(uploadKeyFromPath("/3/%2e%2e/%2e%2e/secret"), null);
    assert.strictEqual(uploadKeyFromPath("/3/..%5C..%5Csecret"), null);
    assert.strictEqual(uploadKeyFromPath("/"), null);
    assert.strictEqual(uploadKeyFromPath("/a%00b"), null);
    assert.strictEqual(uploadKeyFromPath("/%E0%A4%A"), null);
  });
});

describe("uploadKeyFromUrl", () => {
  it("берёт ключ только из адресов /uploads/", () => {
    assert.strictEqual(uploadKeyFromUrl("/uploads/1/2026-08-19/x.mp4"), "1/2026-08-19/x.mp4");
    assert.strictEqual(uploadKeyFromUrl("https://example.com/x.jpg"), null);
    assert.strictEqual(uploadKeyFromUrl("/api/media/s3-proxy/a/b"), null);
  });
});

describe("contentTypeForKey", () => {
  it("определяет тип по расширению без учёта регистра", () => {
    assert.strictEqual(contentTypeForKey("3/a.JPG"), "image/jpeg");
    assert.strictEqual(contentTypeForKey("3/a.mp4"), "video/mp4");
    assert.strictEqual(contentTypeForKey("3/a.bin"), "application/octet-stream");
  });
});

describe("findUploadsBackend", () => {
  const backends = [
    { configId: "local-default", backend: "local" },
    { configId: "s3-uploads", backend: "s3" },
  ] as StorageBackend[];

  it("находит только S3-хранилище с нужным ID", () => {
    assert.strictEqual(findUploadsBackend(backends, "s3-uploads")?.configId, "s3-uploads");
    assert.strictEqual(findUploadsBackend(backends, "local-default"), null);
    assert.strictEqual(findUploadsBackend(backends, null), null);
  });
});
