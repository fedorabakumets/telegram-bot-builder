/**
 * @fileoverview Интеграционные тесты мягкой квоты при загрузке (задача 10.3, Req 4.4, 4.7).
 *
 * Воспроизводит конвейер расчёта флага квоты, который применяет маршрут
 * `POST /api/media/upload/:projectId` (см. `server/routes/routes.ts`):
 *   usedBytes = computeLocalUsedBytes(projectId)
 *   quotaExceeded = isQuotaExceeded(usedBytes, readStorageLimitBytes())
 *   ответ = { ...mediaFile, quotaExceeded }
 *
 * Проверяет:
 *  - под лимитом → quotaExceeded=false; над лимитом → true (Req 4.7);
 *  - мягкость лимита: запись о файле всегда присутствует в ответе, флаг лишь
 *    сигнализирует превышение и не блокирует загрузку (Req 4.7, 4.8);
 *  - в занятое место входят только локальные бэкенды; файлы S3 исключены (Req 4.4);
 *  - безлимит (ENV пуст/0) → quotaExceeded=false при любом объёме (Req 4.5).
 *
 * Тяжёлый HTTP/multer-слой маршрута намеренно не поднимается; интеграция
 * сосредоточена на реальных функциях расчёта квоты поверх in-memory БД.
 * @module server/storage/tests/upload-quota.integration.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../database/db", async () => {
  const { fakeDbModule } = await import("./helpers/fake-db");
  return fakeDbModule;
});

import { state, resetFakeDb, type FakeMediaFileRow } from "./helpers/fake-db";
import { computeLocalUsedBytes, isQuotaExceeded } from "../../routes/media/upload-storage-helper";
import { readStorageLimitBytes, STORAGE_LIMIT_GB_ENV, BYTES_PER_GB } from "../storage-config";

/** Исходное значение ENV для восстановления */
let originalLimit: string | undefined;

/**
 * Имитирует завершающий шаг маршрута загрузки: всегда возвращает запись о
 * файле и флаг мягкой квоты (загрузка не блокируется).
 * @param projectId - ID проекта
 * @param savedFile - Уже сохранённая запись media_files
 * @returns Ответ маршрута `{ ...savedFile, quotaExceeded }`
 */
async function simulateUploadResponse(
  projectId: number,
  savedFile: Record<string, unknown>,
): Promise<Record<string, unknown> & { quotaExceeded: boolean }> {
  const usedBytes = await computeLocalUsedBytes(projectId);
  const quotaExceeded = isQuotaExceeded(usedBytes, readStorageLimitBytes());
  return { ...savedFile, quotaExceeded };
}

/** Добавляет в стор локальный файл проекта */
function addLocalFile(projectId: number, fileSize: number): FakeMediaFileRow {
  const row: FakeMediaFileRow = {
    id: ++state.seq,
    projectId,
    fileSize,
    storageBackend: "local",
    storageConfigId: "local-default",
  };
  state.mediaFiles.push(row);
  return row;
}

beforeEach(() => {
  originalLimit = process.env[STORAGE_LIMIT_GB_ENV];
  resetFakeDb();
});

afterEach(() => {
  if (originalLimit === undefined) {
    delete process.env[STORAGE_LIMIT_GB_ENV];
  } else {
    process.env[STORAGE_LIMIT_GB_ENV] = originalLimit;
  }
});

describe("Мягкая квота при загрузке (Req 4.7)", () => {
  it("под лимитом → quotaExceeded=false, файл сохранён", async () => {
    process.env[STORAGE_LIMIT_GB_ENV] = "1"; // 1 ГБ
    addLocalFile(7, 100 * 1024 * 1024); // 100 МБ — заметно меньше лимита
    const saved = addLocalFile(7, 1024);

    const response = await simulateUploadResponse(7, { id: saved.id, fileName: "small.bin" });

    expect(response.quotaExceeded).toBe(false);
    expect(response.id).toBe(saved.id); // запись всегда возвращается
  });

  it("над лимитом → quotaExceeded=true, но файл всё равно сохранён (мягкий лимит, Req 4.8)", async () => {
    process.env[STORAGE_LIMIT_GB_ENV] = "1"; // 1 ГБ
    addLocalFile(7, 2 * BYTES_PER_GB); // 2 ГБ — превышение

    const response = await simulateUploadResponse(7, { id: 999, fileName: "big.bin" });

    expect(response.quotaExceeded).toBe(true);
    expect(response.id).toBe(999); // загрузка не заблокирована — запись есть
    expect(response.fileName).toBe("big.bin");
  });

  it("файлы S3 не входят в локальную квоту (Req 4.4)", async () => {
    process.env[STORAGE_LIMIT_GB_ENV] = "1";
    addLocalFile(7, 10 * 1024 * 1024); // 10 МБ локально
    // Крупный файл в S3 — не должен учитываться в локальной квоте.
    state.mediaFiles.push({ id: ++state.seq, projectId: 7, fileSize: 5 * BYTES_PER_GB, storageBackend: "s3", storageConfigId: "s3-default" });

    const usedBytes = await computeLocalUsedBytes(7);
    expect(usedBytes).toBe(10 * 1024 * 1024);
    const response = await simulateUploadResponse(7, { id: 1 });
    expect(response.quotaExceeded).toBe(false);
  });
});

describe("Безлимитный режим (Req 4.5)", () => {
  it("ENV пуст → quotaExceeded=false при большом объёме", async () => {
    delete process.env[STORAGE_LIMIT_GB_ENV];
    addLocalFile(7, 50 * BYTES_PER_GB);
    const response = await simulateUploadResponse(7, { id: 1 });
    expect(readStorageLimitBytes()).toBeNull();
    expect(response.quotaExceeded).toBe(false);
  });

  it("ENV=0 → безлимит, quotaExceeded=false", async () => {
    process.env[STORAGE_LIMIT_GB_ENV] = "0";
    addLocalFile(7, 50 * BYTES_PER_GB);
    const response = await simulateUploadResponse(7, { id: 1 });
    expect(response.quotaExceeded).toBe(false);
  });
});
