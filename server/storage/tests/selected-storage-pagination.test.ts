/**
 * @fileoverview Проверка серверной фильтрации выбранного S3 до пагинации.
 * @module server/storage/tests/selected-storage-pagination.test
 */
import { describe, expect, it, vi } from "vitest";

/** Управляемое состояние тестового хранилища и записей. */
const state = vi.hoisted(() => ({ selected: "s3-a", unavailable: false }));
vi.mock("../selected-media-storage", () => ({
  selectedMediaStorageId: async () => {
    if (state.unavailable) throw new Error("Хранилище недоступно");
    return state.selected;
  },
}));
vi.mock("../../routes/botIntegration/handlers/botData/project-files-tokens", () => ({
  buildFileIdsByTokenMap: async () => ({}),
}));
vi.mock("../../routes/botIntegration/handlers/botData/project-files-storage-names", () => ({
  loadStorageNameMap: async () => ({}), resolveStorageName: () => "S3",
}));
vi.mock("../../database/db", async () => {
  const { PgDialect } = await import("drizzle-orm/pg-core");
  const dialect = new PgDialect();
  const rows = [
    { id: 1, projectId: 7, storageConfigId: "s3-a", fileName: "a1.jpg", fileType: "photo", createdAt: new Date(4) },
    { id: 2, projectId: 7, storageConfigId: "s3-b", fileName: "b1.jpg", fileType: "photo", createdAt: new Date(3) },
    { id: 3, projectId: 7, storageConfigId: "s3-a", fileName: "a2.jpg", fileType: "photo", createdAt: new Date(2) },
    { id: 4, projectId: 7, storageConfigId: "local-default", fileName: "local.jpg", fileType: "photo", createdAt: new Date(1) },
    { id: 5, projectId: 8, storageConfigId: "s3-a", fileName: "other.jpg", fileType: "photo", createdAt: new Date(5) },
  ];
  return { db: { select: (fields?: unknown) => ({ from: () => ({ where: (condition: never) => {
    const sql = dialect.sqlToQuery(condition);
    if (!sql.sql.includes('"project_id"') || !sql.sql.includes('"storage_config_id"')) throw new Error("Отсутствует SQL-фильтр");
    const matching = rows.filter((row) => row.projectId === sql.params[0] && row.storageConfigId === sql.params[1]);
    if (fields) return Promise.resolve([{ count: matching.length }]);
    return { orderBy: () => ({ limit: (limit: number) => ({ offset: async (offset: number) => matching.slice(offset, offset + limit) }) }) };
  } }) }) } };
});

import { getProjectFilesHandler } from "../../routes/botIntegration/handlers/botData/getProjectFilesHandler";

/**
 * Вызывает обработчик страницы файлов и собирает HTTP-ответ.
 * @param page - Номер страницы
 * @returns Код и тело ответа
 */
async function page(page: number) {
  const result: { status: number; body: any } = { status: 200, body: null };
  const response = { status(code: number) { result.status = code; return this; }, json(body: unknown) { result.body = body; return this; } };
  await getProjectFilesHandler({ params: { projectId: "7" }, query: { category: "uploaded", limit: "1", page: String(page), storageConfigId: "s3-b" } } as never, response as never);
  return result;
}

describe("Выбранное хранилище и страницы файлов", () => {
  it("фильтрует до пагинации и подсчитывает total, затем переключает S3", async () => {
    state.unavailable = false; state.selected = "s3-a";
    const first = await page(1); const second = await page(2);
    expect(first.body.files.map((file: { id: number }) => file.id)).toEqual([1]);
    expect(second.body.files.map((file: { id: number }) => file.id)).toEqual([3]);
    expect(first.body.total).toBe(2); expect(second.body.total).toBe(2);
    state.selected = "s3-b";
    const switched = await page(1);
    expect(switched.body.files.map((file: { id: number }) => file.id)).toEqual([2]);
    expect(switched.body.total).toBe(1);
  });
  it("возвращает ошибку при недоступном хранилище", async () => {
    state.unavailable = true;
    const result = await page(1);
    expect(result.status).toBe(503);
    expect(result.body.message).toContain("хранилище недоступно");
    state.unavailable = false;
  });
});
