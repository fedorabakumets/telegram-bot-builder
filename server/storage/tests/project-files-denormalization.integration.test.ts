/**
 * @fileoverview Интеграционные тесты денормализации file_id (задача 10.3, Req 8.4, 8.5).
 *
 * Проверяют сквозной путь:
 *  - `POST /api/projects/:projectId/files` (`addProjectFileHandler`) создаёт
 *    запись media_files и денормализует `fileIdsByToken` в `media_file_tokens`;
 *  - обратная сборка карты при чтении (`buildFileIdsByTokenMap`) восстанавливает
 *    исходный `fileIdsByToken`;
 *  - валидация тела (400 при отсутствии mediaType / пустом fileIdsByToken);
 *  - upsert по паре (mediaFileId, tokenId): повторная денормализация обновляет
 *    file_id, не плодя дубликаты.
 *
 * Слой БД замокан in-memory фейком (`helpers/fake-db`); хендлер и функции
 * денормализации/сборки исполняются по-настоящему.
 * @module server/storage/tests/project-files-denormalization.integration.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../database/db", async () => {
  const { fakeDbModule } = await import("./helpers/fake-db");
  return fakeDbModule;
});

import { state, resetFakeDb } from "./helpers/fake-db";
import { addProjectFileHandler } from "../../routes/botIntegration/handlers/botData/addProjectFileHandler";
import { denormalizeFileIdsByToken } from "../../routes/botIntegration/handlers/botData/project-files-denormalize-tokens";
import { buildFileIdsByTokenMap } from "../../routes/botIntegration/handlers/botData/project-files-tokens";

/** Минимальный фейковый res для Express-хендлеров */
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

describe("POST /files → денормализация в media_file_tokens (Req 8.4)", () => {
  it("создаёт media_files и пишет пары (медиафайл, токен)", async () => {
    const req = {
      params: { projectId: "5" },
      body: { mediaType: "photo", fileIdsByToken: { "10": "AgACfile10", "20": "AgACfile20" } },
    };
    const res = makeRes();

    await addProjectFileHandler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    const created = (res.body as { file: { id: number } }).file;

    // Денормализовано ровно две пары для созданного медиафайла.
    const tokens = state.mediaFileTokens.filter((t) => t.mediaFileId === created.id);
    expect(tokens).toHaveLength(2);
    expect(tokens.find((t) => t.tokenId === 10)?.fileId).toBe("AgACfile10");
    expect(tokens.find((t) => t.tokenId === 20)?.fileId).toBe("AgACfile20");
  });

  it("читает media_file_tokens обратно в исходный fileIdsByToken (Req 8.5)", async () => {
    const original = { "10": "AgACfile10", "20": "AgACfile20", "30": "AgACfile30" };
    const req = { params: { projectId: "5" }, body: { mediaType: "video", fileIdsByToken: original } };
    const res = makeRes();

    await addProjectFileHandler(req as never, res as never);
    const created = (res.body as { file: { id: number } }).file;

    const map = await buildFileIdsByTokenMap([created.id]);
    const rebuilt = map[created.id];

    expect(rebuilt).toEqual({ 10: "AgACfile10", 20: "AgACfile20", 30: "AgACfile30" });
  });

  it("400 при отсутствии mediaType", async () => {
    const res = makeRes();
    await addProjectFileHandler(
      { params: { projectId: "5" }, body: { fileIdsByToken: { "1": "x" } } } as never,
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });

  it("400 при пустом fileIdsByToken", async () => {
    const res = makeRes();
    await addProjectFileHandler(
      { params: { projectId: "5" }, body: { mediaType: "photo", fileIdsByToken: {} } } as never,
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });
});

describe("denormalizeFileIdsByToken — upsert и фильтрация (Req 8.4)", () => {
  it("повторная запись обновляет file_id без дубликатов", async () => {
    await denormalizeFileIdsByToken(99, { "7": "old" });
    let result = await denormalizeFileIdsByToken(99, { "7": "new" });

    expect(result.written).toBe(1);
    const tokens = state.mediaFileTokens.filter((t) => t.mediaFileId === 99 && t.tokenId === 7);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].fileId).toBe("new");
  });

  it("игнорирует нечисловые tokenId и пустые file_id", async () => {
    const result = await denormalizeFileIdsByToken(100, { abc: "x", "8": "", "9": "valid" });
    expect(result.written).toBe(1);
    expect(state.mediaFileTokens.filter((t) => t.mediaFileId === 100)).toHaveLength(1);
    expect(state.mediaFileTokens.find((t) => t.mediaFileId === 100)?.tokenId).toBe(9);
  });

  it("пустая карта ничего не пишет", async () => {
    const result = await denormalizeFileIdsByToken(101, {});
    expect(result.written).toBe(0);
    expect(state.mediaFileTokens.filter((t) => t.mediaFileId === 101)).toHaveLength(0);
  });
});
