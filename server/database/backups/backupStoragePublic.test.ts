/**
 * @fileoverview Дамп базы не принимается хранилищем с публичной ссылкой
 * @module server/database/backups/backupStoragePublic.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import type { StorageBackend } from "../../storage/storage-backend";
import { assertBackupStoragePrivate, isPublicBackupStorageUrl } from "./backupStoragePublic";

/**
 * Минимальный бэкенд: проверяется только id и ссылка на объект.
 * @param configId - ID хранилища
 * @param url - Что вернёт getUrl
 * @returns Заглушка StorageBackend
 */
function backend(configId: string, url: string): StorageBackend {
  return {
    backend: "s3",
    configId,
    name: configId,
    readOnly: false,
    getUrl: () => url,
    put: async () => {
      throw new Error("put не вызывается");
    },
    get: async () => {
      throw new Error("get не вызывается");
    },
    delete: async () => {
      throw new Error("delete не вызывается");
    },
  };
}

describe("isPublicBackupStorageUrl", () => {
  it("прямой http(s) и каталог /uploads публичные", () => {
    assert.strictEqual(isPublicBackupStorageUrl("https://cdn.example/db-backups/panel/a.dump"), true);
    assert.strictEqual(isPublicBackupStorageUrl("http://bucket/key?x=1"), true);
    assert.strictEqual(isPublicBackupStorageUrl("/uploads/db-backups/panel/a.dump"), true);
  });

  it("прокси панели и приватная папка не публичные", () => {
    assert.strictEqual(
      isPublicBackupStorageUrl("/api/media/s3-proxy/s3-private/db-backups/probe.dump"),
      false,
    );
    assert.strictEqual(isPublicBackupStorageUrl("/.db-backups/db-backups/probe.dump"), false);
  });
});

describe("assertBackupStoragePrivate", () => {
  it("отклоняет local-default и публичный адрес", () => {
    assert.throws(
      () => assertBackupStoragePrivate(backend("local-default", "/api/media/s3-proxy/local-default/x")),
      /публичное/,
    );
    assert.throws(
      () => assertBackupStoragePrivate(backend("s3-cdn", "https://cdn.example/db-backups/probe.dump")),
      /s3-cdn/,
    );
  });

  it("принимает приватный S3 и папку вне uploads", () => {
    assert.doesNotThrow(() =>
      assertBackupStoragePrivate(backend("s3-private", "/api/media/s3-proxy/s3-private/db-backups/probe.dump")),
    );
    assert.doesNotThrow(() =>
      assertBackupStoragePrivate(backend("db-backups-local", "/.db-backups/db-backups/probe.dump")),
    );
  });
});
