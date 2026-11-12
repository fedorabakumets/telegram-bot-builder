/**
 * @fileoverview Локальная проверка холодного и прогретого кеша сборок без обращения к S3.
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { test } from "node:test";
import { packBotBuild } from "../../server/bots/builds/botBuildCodec";
import { ensureCachedBuild, type RunnerBuild } from "../../server/runner/runnerBuildCache";

/**
 * Создаёт изолированный каталог и локальный HTTP-источник реальной gzip-сборки.
 * @returns Ресурсы стенда и безопасное завершение.
 */
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "tbb-local-webhook-cache-"));
  const code = Buffer.from("# Локальная синтетическая сборка\n" + "print('cached bot')\n".repeat(10_000));
  const packed = packBotBuild(code);
  let downloads = 0;
  const server = createServer((_request, response) => {
    downloads++;
    response.writeHead(200, { "Content-Type": "application/gzip" });
    response.end(packed.data);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const build: RunnerBuild = {
    url: `http://127.0.0.1:${address.port}/artifact`,
    sha256: packed.sha256,
    size: packed.size,
    fingerprint: packed.sha256,
    file_name: "bot.py",
  };
  return {
    root, code, build,
    downloads: () => downloads,
    /** Закрывает локальный сервер и удаляет только созданный каталог. */
    async close() {
      server.closeAllConnections();
      await new Promise<void>((done, fail) => server.close((error) => error ? fail(error) : done()));
      const target = resolve(root);
      assert.ok(target.startsWith(resolve(tmpdir()) + sep));
      assert.ok(target.includes("tbb-local-webhook-cache-"));
      await rm(target, { recursive: true, force: true });
    },
  };
}

test("холодный кеш скачивает, прогретый работает даже при недоступном источнике", async () => {
  const local = await fixture();
  try {
    const file = await ensureCachedBuild(local.build, local.root);
    assert.deepEqual(await readFile(file), local.code);
    assert.equal(local.downloads(), 1);
    const warmFile = await ensureCachedBuild({ ...local.build, url: "http://127.0.0.1:1/unavailable" }, local.root);
    assert.equal(warmFile, file);
    assert.equal(local.downloads(), 1);
  } finally { await local.close(); }
});

test("повреждённая локальная копия повторно скачивается и проверяется", async () => {
  const local = await fixture();
  try {
    const file = await ensureCachedBuild(local.build, local.root);
    await writeFile(file, "corrupted");
    await ensureCachedBuild(local.build, local.root);
    assert.equal(local.downloads(), 2);
    assert.deepEqual(await readFile(file), local.code);
  } finally { await local.close(); }
});

test("несовпадение sha256 скачанной сборки не создаёт исполняемый файл", async () => {
  const local = await fixture();
  try {
    await assert.rejects(ensureCachedBuild({ ...local.build, sha256: "0".repeat(64) }, local.root), /повреждена/);
    assert.equal(local.downloads(), 1);
    await assert.rejects(readFile(join(local.root, local.build.fingerprint, "bot.py")), { code: "ENOENT" });
  } finally { await local.close(); }
});

test("замер десяти холодных и прогретых проходов только на локальном HTTP", async (context) => {
  const local = await fixture();
  const cold: number[] = [];
  const warm: number[] = [];
  try {
    for (let iteration = 0; iteration < 10; iteration++) {
      const cacheDir = join(local.root, String(iteration));
      const coldStart = performance.now();
      await ensureCachedBuild(local.build, cacheDir);
      cold.push(performance.now() - coldStart);
      const warmStart = performance.now();
      await ensureCachedBuild(local.build, cacheDir);
      warm.push(performance.now() - warmStart);
    }
    assert.equal(local.downloads(), 10);
    context.diagnostic(JSON.stringify({ scope: "локальный HTTP, не S3 и не запуск Python", bytes: local.code.length,
      coldMs: cold.map((value) => Number(value.toFixed(3))), warmMs: warm.map((value) => Number(value.toFixed(3))) }));
  } finally { await local.close(); }
});
