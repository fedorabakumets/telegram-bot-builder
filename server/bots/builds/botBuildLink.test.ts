/**
 * @fileoverview Тесты ссылки на сборку для исполнителя и проверки режима WORKER_RUNTIME=remote
 * @module server/bots/builds/botBuildLink.test
 */

import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import type { BotBuild } from "@shared/schema";
import type { StorageBackend } from "../../storage/storage-backend";
import { getBotBuildLink } from "./botBuildLink";
import { resolveRunnerBuildForStart } from "./runnerBuildForStart";

/** Запись сборки в таблице */
const BUILD = {
  id: 1,
  projectId: 2,
  tokenId: 3,
  fingerprint: "ab".repeat(16),
  storageConfigId: "s3-builds",
  objectKey: "bot-builds/2/3/x.py.gz",
  fileName: "bot.py",
  size: 10,
  sha256: "f".repeat(64),
  generatorVersion: "v",
} as unknown as BotBuild;

/**
 * Зависимости с заданным хранилищем
 * @param backend - Хранилище или null
 * @param build - Запись сборки или null
 * @returns findBuild и resolveBackend
 */
function deps(backend: unknown, build: BotBuild | null = BUILD) {
  return {
    findBuild: async () => build,
    resolveBackend: async () => backend as StorageBackend | null,
  };
}

/** S3-хранилище, запоминающее запрос ссылки */
const s3 = { getPresignedUrl: async (key: string, ttl?: number) => `https://s3.local/${key}?ttl=${ttl}` };

describe("getBotBuildLink", () => {
  it("выдаёт временную ссылку и данные проверки", async () => {
    assert.deepStrictEqual(await getBotBuildLink(3, BUILD.fingerprint, deps(s3), 60), {
      url: "https://s3.local/bot-builds/2/3/x.py.gz?ttl=60",
      sha256: BUILD.sha256,
      size: 10,
      fingerprint: BUILD.fingerprint,
      fileName: "bot.py",
    });
  });

  it("локальная папка ссылок не выдаёт", async () => {
    const result = await getBotBuildLink(3, BUILD.fingerprint, deps({ put: async () => undefined }));
    assert.match((result as { error: string }).error, /нужен S3/);
  });

  it("нет сборки — понятная причина", async () => {
    const result = await getBotBuildLink(3, BUILD.fingerprint, deps(s3, null));
    assert.match((result as { error: string }).error, /не найдена/);
  });
});

describe("resolveRunnerBuildForStart", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });
  const ctx = { projectId: 2, tokenId: 3, fingerprint: BUILD.fingerprint, generatorVersion: "v", mainFile: "/x/bot.py" };

  it("вне remote ничего не делает", async () => {
    process.env.WORKER_RUNTIME = "docker";
    assert.deepStrictEqual(await resolveRunnerBuildForStart(ctx, deps(s3)), {});
  });

  it("remote без хранения сборок — ошибка с подсказкой", async () => {
    process.env.WORKER_RUNTIME = "remote";
    delete process.env.BOT_ARTIFACT_SOURCE;
    assert.match((await resolveRunnerBuildForStart(ctx, deps(s3))).error ?? "", /BOT_ARTIFACT_SOURCE=storage/);
  });

  it("remote со сборкой в S3 — ссылка; WORKER_RUNNER_CODE=path — без неё", async () => {
    process.env.WORKER_RUNTIME = "remote";
    process.env.BOT_ARTIFACT_SOURCE = "storage";
    assert.strictEqual((await resolveRunnerBuildForStart(ctx, deps(s3))).build?.fileName, "bot.py");
    process.env.WORKER_RUNNER_CODE = "path";
    assert.deepStrictEqual(await resolveRunnerBuildForStart(ctx, deps(s3)), {});
  });

  it("проект на Railway получает ссылку даже при WORKER_RUNNER_CODE=path", async () => {
    process.env.WORKER_RUNTIME = "docker";
    process.env.WORKER_RAILWAY_PROJECTS = "2";
    process.env.BOT_ARTIFACT_SOURCE = "storage";
    process.env.WORKER_RUNNER_CODE = "path";
    assert.strictEqual((await resolveRunnerBuildForStart(ctx, deps(s3))).build?.fileName, "bot.py");
  });
});
