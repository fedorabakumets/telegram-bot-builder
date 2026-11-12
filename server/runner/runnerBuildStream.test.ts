/**
 * @fileoverview Проверка потоковой загрузки сборок, лимитов и атомарности кеша.
 */
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { packBotBuild } from "../bots/builds/botBuildCodec";
import { ensureCachedBuild, type RunnerBuild } from "./runnerBuildCache";
import { writeBuildStream } from "./runnerBuildStream";
import { Readable } from "node:stream";

/**
 * Запускает временный HTTP-сервер и удаляет тестовый кеш после сценария.
 * @param run - Проверяемый сценарий
 * @returns Завершение сценария
 */
async function fixture(run: (build: RunnerBuild, dir: string, server: Server) => Promise<void>): Promise<void> {
  const code = Buffer.from("print('поток')\n".repeat(100_000));
  const packed = packBotBuild(code);
  const dir = await mkdtemp(join(tmpdir(), "runner-stream-"));
  const server = createServer((request, response) => {
    if (request.url === "/redirect") { response.writeHead(302, { location: "/build" }); response.end(); return; }
    if (request.url === "/missing") { response.writeHead(403); response.end(); return; }
    response.end(packed.data);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const build = { url: `http://127.0.0.1:${address.port}/build`, size: packed.size,
    sha256: packed.sha256, fingerprint: "ab".repeat(16), file_name: "bot.py" };
  try { await run(build, dir, server); }
  finally { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(dir, { recursive: true }); }
}

test("HTTP поток, относительный редирект и проверка повреждённого кеша", async () => {
  await fixture(async (build, dir) => {
    const file = await ensureCachedBuild({ ...build, url: build.url.replace("/build", "/redirect") }, dir);
    assert.equal((await readFile(file)).length, build.size);
    await writeFile(file, "испорчено");
    await ensureCachedBuild(build, dir);
    assert.equal((await readFile(file)).length, build.size);
    await ensureCachedBuild({ ...build, url: build.url.replace("/build", "/missing") }, dir);
  });
});

test("неверный хеш не публикуется и временный файл удаляется", async () => {
  await fixture(async (build, dir) => {
    await assert.rejects(ensureCachedBuild({ ...build, sha256: "0".repeat(64) }, dir), /повреждена/);
    assert.deepEqual(await readdir(join(dir, build.fingerprint)), []);
  });
});

test("лимит распаковки останавливает поток и сохраняет прежний файл", async () => {
  await fixture(async (build, dir) => {
    const file = await ensureCachedBuild(build, dir);
    await writeFile(file, "прежний");
    await assert.rejects(ensureCachedBuild({ ...build, size: 4 }, dir), /размер/);
    assert.equal(await readFile(file, "utf8"), "прежний");
    assert.deepEqual(await readdir(join(dir, build.fingerprint)), ["bot.py"]);
  });
});

test("ошибка HTTP передаётся вызывающему без создания исходника", async () => {
  await fixture(async (build, dir) => {
    await assert.rejects(ensureCachedBuild({ ...build, url: build.url.replace("/build", "/missing") }, dir), /HTTP 403/);
    assert.deepEqual(await readdir(join(dir, build.fingerprint)), []);
  });
});

test("оборванный gzip не оставляет временных файлов", async () => {
  await fixture(async (build, dir) => {
    await assert.rejects(writeBuildStream(Readable.from([Buffer.from([31, 139, 8])]), join(dir, "bot.py"), build));
    assert.deepEqual(await readdir(dir), []);
  });
});

test("размер из команды ограничивается до открытия сетевого соединения", async () => {
  await fixture(async (build, dir) => {
    await assert.rejects(ensureCachedBuild({ ...build, size: Number.MAX_SAFE_INTEGER }, dir), /размер/);
    assert.deepEqual(await readdir(dir), []);
    await assert.rejects(ensureCachedBuild({ ...build, size: -1 }, dir), /размер/);
  });
});

test("лимит сжатого потока удаляет временный файл", async () => {
  await fixture(async (build, dir) => {
    const previous = process.env.RUNNER_BUILD_MAX_COMPRESSED_BYTES;
    process.env.RUNNER_BUILD_MAX_COMPRESSED_BYTES = "8";
    try {
      await assert.rejects(ensureCachedBuild(build, dir), /размер/);
      assert.deepEqual(await readdir(join(dir, build.fingerprint)), []);
    } finally {
      if (previous === undefined) delete process.env.RUNNER_BUILD_MAX_COMPRESSED_BYTES;
      else process.env.RUNNER_BUILD_MAX_COMPRESSED_BYTES = previous;
    }
  });
});
