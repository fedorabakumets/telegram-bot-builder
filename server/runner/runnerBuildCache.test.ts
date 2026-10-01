/**
 * @fileoverview Тесты кеша сборок исполнителя и подготовки строки start_bot
 * @module server/runner/runnerBuildCache.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { packBotBuild } from "../bots/builds/botBuildCodec";
import { ensureCachedBuild, parseRunnerBuild, pruneBuildCache, type RunnerBuild } from "./runnerBuildCache";
import { prepareWorkerLine } from "./runnerStartCommand";

/** Код тестового бота */
const CODE = Buffer.from("print('hello')\n");

/**
 * Сборка и скачивание, считающее вызовы
 * @param fingerprint - Отпечаток
 * @returns сборка, счётчик и функция скачивания
 */
function fixture(fingerprint = "ab".repeat(16)) {
  const packed = packBotBuild(CODE);
  const build: RunnerBuild = { url: "https://s3/x", sha256: packed.sha256, size: packed.size, fingerprint, file_name: "bot.py" };
  const calls = { n: 0 };
  const fetchBuild = async () => {
    calls.n++;
    return packed.data;
  };
  return { build, calls, fetchBuild, cacheDir: mkdtempSync(join(tmpdir(), "runner-cache-")) };
}

describe("ensureCachedBuild", () => {
  it("скачивает один раз, затем берёт из кеша", async () => {
    const { build, calls, fetchBuild, cacheDir } = fixture();
    const file = await ensureCachedBuild(build, cacheDir, fetchBuild);
    assert.strictEqual(file, join(cacheDir, build.fingerprint, "bot.py"));
    assert.deepStrictEqual(readFileSync(file), CODE);
    await ensureCachedBuild(build, cacheDir, fetchBuild);
    assert.strictEqual(calls.n, 1);
  });

  it("отклоняет сборку с неверным sha256 и ничего не пишет", async () => {
    const { build, fetchBuild, cacheDir } = fixture();
    await assert.rejects(ensureCachedBuild({ ...build, sha256: "0".repeat(64) }, cacheDir, fetchBuild), /повреждена/);
    assert.ok(!existsSync(join(cacheDir, build.fingerprint, "bot.py")));
  });
});

describe("parseRunnerBuild", () => {
  it("не пускает пути в отпечатке и имени файла", () => {
    const { build } = fixture();
    assert.throws(() => parseRunnerBuild({ ...build, fingerprint: "../../etc" }), /отпечаток/);
    assert.throws(() => parseRunnerBuild({ ...build, file_name: "../x.py" }), /имя файла/);
    assert.throws(() => parseRunnerBuild({ ...build, file_name: "x.sh" }), /имя файла/);
  });
});

describe("pruneBuildCache", () => {
  it("оставляет последние сборки и не трогает запущенные", async () => {
    const cacheDir = mkdtempSync(join(tmpdir(), "runner-prune-"));
    ["a", "b", "c", "d"].forEach((name, i) => {
      mkdirSync(join(cacheDir, name));
      const t = new Date(Date.now() - (4 - i) * 60_000);
      utimesSync(join(cacheDir, name), t, t);
    });
    await pruneBuildCache(cacheDir, 2, new Set(["a"]));
    assert.deepStrictEqual(["a", "b", "c", "d"].filter((n) => existsSync(join(cacheDir, n))), ["a", "c", "d"]);
  });
});

describe("prepareWorkerLine", () => {
  it("строки без сборки не меняет", async () => {
    const { cacheDir, fetchBuild } = fixture();
    assert.deepStrictEqual(await prepareWorkerLine('{"cmd":"stop_bot","token_id":1}', cacheDir, fetchBuild), {
      line: '{"cmd":"stop_bot","token_id":1}',
    });
  });

  it("заменяет build на локальный bot_file", async () => {
    const { build, cacheDir, fetchBuild } = fixture();
    const line = JSON.stringify({ cmd: "start_bot", token_id: 3, bot_file: "/panel/bots/x/bot.py", build });
    const prepared = await prepareWorkerLine(line, cacheDir, fetchBuild);
    assert.ok(!("error" in prepared));
    const command = JSON.parse(prepared.line);
    assert.strictEqual(command.bot_file, join(cacheDir, build.fingerprint, "bot.py"));
    assert.strictEqual(command.build, undefined);
    assert.deepStrictEqual([prepared.tokenId, prepared.fingerprint], [3, build.fingerprint]);
  });

  it("ошибка скачивания — причина для лога бота", async () => {
    const { build, cacheDir } = fixture();
    const line = JSON.stringify({ cmd: "start_bot", token_id: 3, build });
    const prepared = await prepareWorkerLine(line, cacheDir, async () => {
      throw new Error("HTTP 403 при скачивании сборки");
    });
    assert.deepStrictEqual(prepared, { tokenId: 3, error: "Исполнитель не получил код бота: HTTP 403 при скачивании сборки" });
  });
});
