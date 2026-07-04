/**
 * @fileoverview Интеграционные тесты выдачи файлов проекта
 * `GET /api/projects/:projectId/files` (задача 10.3, Req 5.*, 6.*).
 *
 * Тестируется связка `parseProjectFilesQuery` + `getProjectFilesHandler`:
 *  - маршрутизация по категориям: uploaded → queryUploadedFiles,
 *    all → queryAllFiles, incoming/outgoing → queryMessageFiles (Req 5.1–5.5);
 *  - проброс всех query-фильтров (fileName, dateFrom/dateTo, mediaType,
 *    uploadedBy, sizeMin/sizeMax, storageConfigId) в слой запроса (Req 6.2–6.7);
 *  - форма ответа `{ files, total, page, limit }`;
 *  - валидация: неверный projectId/category, dateFrom > dateTo,
 *    sizeMin > sizeMax → 400 (Req 6.9).
 *
 * Слой запросов к БД замокан: проверяется именно логика хендлера и разбор
 * параметров, без обращения к Postgres.
 * @module server/storage/tests/get-project-files.integration.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

/** Мок-функции слоёв запроса (объявлены через hoisted для доступа в фабриках) */
const mocks = vi.hoisted(() => ({
  queryUploadedFiles: vi.fn(),
  queryMessageFiles: vi.fn(),
  queryAllFiles: vi.fn(),
}));

vi.mock("../../routes/botIntegration/handlers/botData/project-files-uploaded-query", () => ({
  queryUploadedFiles: mocks.queryUploadedFiles,
}));
vi.mock("../../routes/botIntegration/handlers/botData/project-files-messages-query", () => ({
  queryMessageFiles: mocks.queryMessageFiles,
}));
vi.mock("../../routes/botIntegration/handlers/botData/project-files-all-query", () => ({
  queryAllFiles: mocks.queryAllFiles,
}));

import { getProjectFilesHandler } from "../../routes/botIntegration/handlers/botData/getProjectFilesHandler";

/** Строит фейковый req с query-параметрами */
function makeReq(projectId: string, query: Record<string, string>) {
  return { params: { projectId }, query } as never;
}

/** Минимальный фейковый res */
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
  mocks.queryUploadedFiles.mockReset().mockResolvedValue({ files: [{ id: 1 }], total: 1 });
  mocks.queryMessageFiles.mockReset().mockResolvedValue({ files: [{ id: 2 }], total: 2 });
  mocks.queryAllFiles.mockReset().mockResolvedValue({ files: [{ id: 3 }], total: 3 });
});

describe("Маршрутизация по категориям (Req 5.1–5.5)", () => {
  it("category=uploaded → queryUploadedFiles + форма ответа", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "uploaded", page: "2", limit: "10" }), res as never);

    expect(mocks.queryUploadedFiles).toHaveBeenCalledTimes(1);
    expect(mocks.queryMessageFiles).not.toHaveBeenCalled();
    expect(res.body).toEqual({ files: [{ id: 1 }], total: 1, page: 2, limit: 10 });
  });

  it("category=all → queryAllFiles", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "all" }), res as never);
    expect(mocks.queryAllFiles).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({ total: 3 });
  });

  it("category=incoming → queryMessageFiles с категорией incoming", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "incoming" }), res as never);
    expect(mocks.queryMessageFiles).toHaveBeenCalledTimes(1);
    expect(mocks.queryMessageFiles.mock.calls[0][1]).toBe("incoming");
  });

  it("category=outgoing → queryMessageFiles с категорией outgoing", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "outgoing" }), res as never);
    expect(mocks.queryMessageFiles.mock.calls[0][1]).toBe("outgoing");
  });
});

describe("Проброс фильтров в слой запроса uploaded (Req 6.2–6.7)", () => {
  it("передаёт все фильтры в queryUploadedFiles", async () => {
    const res = makeRes();
    await getProjectFilesHandler(
      makeReq("5", {
        category: "uploaded",
        fileName: "отчёт",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        mediaType: "photo",
        uploadedBy: "42",
        sizeMin: "100",
        sizeMax: "5000",
        storageConfigId: "s3-default",
      }),
      res as never,
    );

    // Аргументы queryUploadedFiles: (projectId, filters, limit, offset)
    const [projectId, filters] = mocks.queryUploadedFiles.mock.calls[0];
    expect(projectId).toBe(5);
    expect(filters).toMatchObject({
      fileName: "отчёт",
      mediaType: "photo",
      uploadedBy: 42,
      sizeMin: 100,
      sizeMax: 5000,
      storageConfigId: "s3-default",
    });
    expect(filters.dateFrom).toBeInstanceOf(Date);
    expect(filters.dateTo).toBeInstanceOf(Date);
  });

  it("storageConfigId=all трактуется как отсутствие фильтра по хранилищу", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "uploaded", storageConfigId: "all" }), res as never);
    const filters = mocks.queryUploadedFiles.mock.calls[0][1];
    expect(filters.storageConfigId).toBeUndefined();
  });

  it("mediaType=cover (обложка) пробрасывается как спец-фильтр (Req 6.4)", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "uploaded", mediaType: "cover" }), res as never);
    expect(mocks.queryUploadedFiles.mock.calls[0][1].mediaType).toBe("cover");
  });
});

describe("Валидация query-параметров (Req 6.9)", () => {
  it("400 при неверном projectId", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("abc", { category: "uploaded" }), res as never);
    expect(res.statusCode).toBe(400);
    expect(mocks.queryUploadedFiles).not.toHaveBeenCalled();
  });

  it("400 при отсутствующей/неверной категории", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", {}), res as never);
    expect(res.statusCode).toBe(400);

    const res2 = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "bogus" }), res2 as never);
    expect(res2.statusCode).toBe(400);
  });

  it("400 при неверном mediaType", async () => {
    const res = makeRes();
    await getProjectFilesHandler(makeReq("5", { category: "uploaded", mediaType: "hologram" }), res as never);
    expect(res.statusCode).toBe(400);
  });

  it("400 при dateFrom > dateTo", async () => {
    const res = makeRes();
    await getProjectFilesHandler(
      makeReq("5", { category: "uploaded", dateFrom: "2026-12-31", dateTo: "2026-01-01" }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });

  it("400 при sizeMin > sizeMax", async () => {
    const res = makeRes();
    await getProjectFilesHandler(
      makeReq("5", { category: "uploaded", sizeMin: "5000", sizeMax: "100" }),
      res as never,
    );
    expect(res.statusCode).toBe(400);
  });
});
