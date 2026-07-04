/**
 * @fileoverview Интеграционные тесты мульти-хранилища (задача 10.3).
 *
 * Покрывают (по разделу Testing Strategy дизайна):
 *  - round-trip put → get → delete для `LocalDiskBackend` на реальной временной
 *    папке (Req 10.4, 12.5);
 *  - `StorageRegistry.reload()` строит бэкенды из `storage_configs`, корректно
 *    резолвит по configId, откатывает null/неизвестный к `local-default`
 *    (Req 10.3–10.5), и подхватывает новый конфиг без рестарта (Req 10.7),
 *    не ломая резолв остальных хранилищ (Req 10.8);
 *  - `DELETE /api/storage-configs/:id` запрещает удаление конфига с файлами →
 *    409, удаляет при отсутствии файлов и отдаёт 404 для несуществующего
 *    (Req 11.8).
 *
 * Слой БД замокан in-memory фейком (`helpers/fake-db`); хранилища — реальные
 * локальные папки во временной директории, без внешних сервисов.
 * @module server/storage/tests/storage-multistorage.integration.test
 */

import { mkdtemp, rm, readFile } from "fs/promises";
import os from "os";
import path from "path";

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Подменяем слой БД фейком до импорта модулей, которые его используют.
vi.mock("../../database/db", async () => {
  const { fakeDbModule } = await import("./helpers/fake-db");
  return fakeDbModule;
});

import { state, resetFakeDb, type FakeStorageConfigRow } from "./helpers/fake-db";
import { LocalDiskBackend } from "../local-disk-backend";
import { StorageRegistryImpl } from "../storage-registry";
import { LOCAL_DEFAULT_ID } from "../storage-config";
import { deleteStorageConfigHandler } from "../../routes/storageConfigs/handlers/deleteStorageConfigHandler";

/** Список временных директорий для очистки после тестов */
const tempDirs: string[] = [];

/**
 * Создаёт уникальную временную директорию и регистрирует её для очистки.
 * @returns Абсолютный путь к временной директории
 */
async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "fsr-store-"));
  tempDirs.push(dir);
  return dir;
}

/**
 * Полностью вычитывает читаемый поток в буфер.
 * @param stream - Читаемый поток
 * @returns Буфер с содержимым потока
 */
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

/**
 * Строит строку реестра локального хранилища.
 * @param id - Идентификатор конфига
 * @param rootPath - Корневая папка
 * @param isActive - Активность для записи
 * @returns Строка `storage_configs`
 */
function localConfigRow(id: string, rootPath: string, isActive = false): FakeStorageConfigRow {
  return {
    id,
    name: `Локально: ${id}`,
    backend: "local",
    isActive,
    config: { rootPath },
    secretsEnc: null,
    readOnly: false,
    createdAt: new Date(),
  };
}

/** Минимальная фейковая пара req/res для драйва Express-хендлеров */
function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

beforeEach(() => {
  resetFakeDb();
});

afterAll(async () => {
  await Promise.all(tempDirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe("LocalDiskBackend put → get → delete round-trip (Req 10.4, 12.5)", () => {
  it("сохраняет, читает идентичный буфер и удаляет объект", async () => {
    const root = await makeTempDir();
    const backend = new LocalDiskBackend({
      configId: "local-tmp",
      name: "tmp",
      readOnly: false,
      rootPath: root,
    });

    const payload = Buffer.from("интеграционный тест хранилища", "utf-8");
    const stored = await backend.put("42/2026/sample.bin", payload, "application/octet-stream");

    expect(stored.backend).toBe("local");
    expect(stored.configId).toBe("local-tmp");
    expect(stored.size).toBe(payload.length);

    const readBack = await streamToBuffer(await backend.get("42/2026/sample.bin"));
    expect(readBack.equals(payload)).toBe(true);

    await backend.delete("42/2026/sample.bin");
    await expect(backend.get("42/2026/sample.bin")).rejects.toBeTruthy();
  });

  it("повторное удаление отсутствующего объекта идемпотентно (ENOENT игнорируется)", async () => {
    const root = await makeTempDir();
    const backend = new LocalDiskBackend({ configId: "l", name: "l", readOnly: false, rootPath: root });
    await expect(backend.delete("nope/missing.bin")).resolves.toBeUndefined();
  });
});

describe("StorageRegistry.reload + resolveBackend (Req 10.3–10.5, 10.7, 10.8)", () => {
  it("строит бэкенды из storage_configs и резолвит по configId", async () => {
    const rootDefault = await makeTempDir();
    const rootA = await makeTempDir();
    state.storageConfigs = [
      localConfigRow(LOCAL_DEFAULT_ID, rootDefault, false),
      localConfigRow("local-a", rootA, true),
    ];

    const registry = new StorageRegistryImpl();
    await registry.reload();

    expect(registry.list().map((b) => b.configId).sort()).toEqual(["local-a", LOCAL_DEFAULT_ID]);
    expect(registry.resolveBackend("local-a").configId).toBe("local-a");
    // Активным помечен local-a → getActiveBackend возвращает его.
    expect(registry.getActiveBackend().configId).toBe("local-a");
  });

  it("null и неизвестный configId откатываются к local-default (Req 10.5)", async () => {
    const rootDefault = await makeTempDir();
    const rootA = await makeTempDir();
    state.storageConfigs = [
      localConfigRow(LOCAL_DEFAULT_ID, rootDefault, true),
      localConfigRow("local-a", rootA, false),
    ];
    const registry = new StorageRegistryImpl();
    await registry.reload();

    expect(registry.resolveBackend(null).configId).toBe(LOCAL_DEFAULT_ID);
    expect(registry.resolveBackend("does-not-exist").configId).toBe(LOCAL_DEFAULT_ID);
  });

  it("reload подхватывает новый конфиг без рестарта и не ломает резолв прочих (Req 10.7, 10.8)", async () => {
    const rootDefault = await makeTempDir();
    const rootA = await makeTempDir();
    state.storageConfigs = [localConfigRow(LOCAL_DEFAULT_ID, rootDefault, true), localConfigRow("local-a", rootA)];

    const registry = new StorageRegistryImpl();
    await registry.reload();
    expect(registry.resolveBackend("local-a").configId).toBe("local-a");
    // Нового конфига ещё нет — откат к дефолту.
    expect(registry.resolveBackend("local-b").configId).toBe(LOCAL_DEFAULT_ID);

    // Добавляем второй конфиг и перезагружаем реестр (без пересоздания инстанса).
    const rootB = await makeTempDir();
    state.storageConfigs.push(localConfigRow("local-b", rootB));
    await registry.reload();

    expect(registry.resolveBackend("local-b").configId).toBe("local-b");
    // Резолв ранее существовавшего хранилища не изменился (Req 10.8).
    expect(registry.resolveBackend("local-a").configId).toBe("local-a");
  });

  it("listWritable исключает read-only хранилища", async () => {
    const rootDefault = await makeTempDir();
    const rootRo = await makeTempDir();
    const ro = localConfigRow("local-ro", rootRo);
    ro.readOnly = true;
    state.storageConfigs = [localConfigRow(LOCAL_DEFAULT_ID, rootDefault, true), ro];

    const registry = new StorageRegistryImpl();
    await registry.reload();

    const writable = registry.listWritable().map((b) => b.configId);
    expect(writable).toContain(LOCAL_DEFAULT_ID);
    expect(writable).not.toContain("local-ro");
  });
});

describe("DELETE /api/storage-configs/:id — запрет удаления конфига с файлами (Req 11.8)", () => {
  it("возвращает 409, если на хранилище есть файлы", async () => {
    state.storageConfigs = [localConfigRow("s3-x", "uploads")];
    state.mediaFiles = [{ id: 1, projectId: 7, storageConfigId: "s3-x", storageBackend: "s3", fileSize: 10 }];

    const res = makeRes();
    await deleteStorageConfigHandler({ params: { id: "s3-x" } } as never, res as never);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ filesCount: 1 });
  });

  it("удаляет конфиг, если файлов нет (200)", async () => {
    const rootDefault = await makeTempDir();
    // local-default нужен, чтобы reload после удаления прошёл штатно.
    state.storageConfigs = [localConfigRow(LOCAL_DEFAULT_ID, rootDefault, true), localConfigRow("empty-store", "uploads2")];
    state.mediaFiles = [];

    const res = makeRes();
    await deleteStorageConfigHandler({ params: { id: "empty-store" } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, id: "empty-store" });
  });

  it("возвращает 404 для несуществующего конфига", async () => {
    state.storageConfigs = [];
    const res = makeRes();
    await deleteStorageConfigHandler({ params: { id: "ghost" } } as never, res as never);
    expect(res.statusCode).toBe(404);
  });
});
