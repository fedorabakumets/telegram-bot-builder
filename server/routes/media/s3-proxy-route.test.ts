/**
 * @fileoverview Тесты S3-прокси: чужой проект и ключ без media_files не отдаются
 * @module server/routes/media/s3-proxy-route.test
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { Readable } from "stream";

import express from "express";

import { S3_PROXY_BASE } from "../../storage/s3-backend";
import type { StorageBackend } from "../../storage/storage-backend";
import { setupS3ProxyRoute } from "./s3-proxy-route";

/** ID, совпадающий с хранилищем загрузок: само по себе доступ не даёт */
const UPLOADS_ID = "s3-uploads";

/** Объекты бакета: свой файл, чужой проект и бэкап без строки media_files */
const objects = new Map<string, string>([
  ["3/2026-08-19/a.jpg", "jpeg-bytes"],
  ["9/other.jpg", "foreign-bytes"],
  ["backups/nightly.tar", "backup-bytes"],
]);

/** Ключи, которые обработчик реально прочитал из бакета */
const fetched: string[] = [];

/** Поддельный S3-бэкенд хранилища загрузок */
const s3 = {
  backend: "s3",
  configId: UPLOADS_ID,
  get: async (key: string) => {
    fetched.push(key);
    const body = objects.get(key);
    if (body === undefined) throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
    return Readable.from([Buffer.from(body)]);
  },
} as unknown as StorageBackend;

/** Зарегистрированные ключи: путь → projectId */
const media = new Map<string, number>([
  ["3/2026-08-19/a.jpg", 3],
  ["9/other.jpg", 9],
]);

/** Проекты, доступные личности 1 */
const allowed = new Set<number>([3]);

/** Личность запроса; null — нет сессии */
let ownerId: number | null = 1;
let server: Server;
let base = "";

before(async () => {
  const app = express();
  setupS3ProxyRoute(app, {
    findMedia: async (configId, filePath) => {
      if (configId !== UPLOADS_ID) return null;
      const projectId = media.get(filePath);
      return projectId === undefined ? null : { projectId };
    },
    getOwnerId: () => ownerId,
    hasProjectAccess: async (projectId, userId) => userId === 1 && allowed.has(projectId),
    listBackends: async () => [s3],
  });
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

/**
 * GET объекта прокси и сброс списка чтений бакета.
 * @param key - Ключ объекта
 * @returns Ответ fetch
 */
function getKey(key: string): Promise<Response> {
  fetched.length = 0;
  return fetch(`${base}${S3_PROXY_BASE}/${UPLOADS_ID}/${key}`);
}

describe("setupS3ProxyRoute", () => {
  it("свой проект отдаёт файл с приватным кэшем", async () => {
    ownerId = 1;
    const res = await getKey("3/2026-08-19/a.jpg");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("cache-control"), "private");
    assert.strictEqual(await res.text(), "jpeg-bytes");
    assert.deepStrictEqual(fetched, ["3/2026-08-19/a.jpg"]);
  });

  it("чужой проект — отказ, бакет не читается", async () => {
    ownerId = 1;
    const res = await getKey("9/other.jpg");
    assert.strictEqual(res.status, 403);
    assert.deepStrictEqual(await res.json(), { message: "Нет прав доступа к проекту" });
    assert.deepStrictEqual(fetched, []);
  });

  it("ключ без строки — отказ, даже если configId равен хранилищу загрузок", async () => {
    ownerId = 1;
    const res = await getKey("backups/nightly.tar");
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(await res.json(), { message: "Медиафайл не найден" });
    assert.deepStrictEqual(fetched, []);
  });

  it("без личности — 401", async () => {
    ownerId = null;
    const res = await getKey("3/2026-08-19/a.jpg");
    ownerId = 1;
    assert.strictEqual(res.status, 401);
    assert.deepStrictEqual(await res.json(), { error: "UNAUTHORIZED" });
    assert.deepStrictEqual(fetched, []);
  });

  it("выход из папки — 404", async () => {
    ownerId = 1;
    fetched.length = 0;
    const res = await fetch(`${base}${S3_PROXY_BASE}/${UPLOADS_ID}/3/..%2F..%2F.env`);
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(fetched, []);
  });
});
