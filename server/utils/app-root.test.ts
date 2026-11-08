/** @fileoverview Проверка путей ресурсов при запуске исходников и бандла вне репозитория. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import { appPath } from "./app-root";

/** Проверяет чтение исходных ресурсов и независимость пути от каталога бандла. */
test("ресурсы доступны из корня приложения и после переноса серверного бандла", async () => {
  const root = process.cwd();
  const prior = process.env.BOTCRAFT_APP_ROOT;
  const temporary = mkdtempSync(join(tmpdir(), "botcraft-paths-"));
  try {
    delete process.env.BOTCRAFT_APP_ROOT;
    for (const resource of ["server/python/worker.py", "server/bots/userbotAuth.py",
      "server/database/bot-runtime/bot-runtime-role.sql", "server/storage/windows-media-read.ps1",
      "server/templates/bot-manager.json", "lib/generated/mcp-docs"]) {
      assert.equal(existsSync(appPath(resource)), true, resource);
    }
    process.env.BOTCRAFT_APP_ROOT = temporary;
    assert.equal(appPath("server", "python"), resolve(temporary, "server", "python"));
    const output = join(temporary, "index.mjs");
    await build({ entryPoints: [join(root, "server/utils/app-root.ts")], outfile: output,
      bundle: true, platform: "node", format: "esm" });
    const result = execFileSync(process.execPath, ["--input-type=module", "-e",
      `import { appPath } from './index.mjs'; console.log(appPath('server', 'python', 'worker.py'));`],
    { cwd: temporary, env: { ...process.env, BOTCRAFT_APP_ROOT: root }, encoding: "utf8" });
    assert.equal(result.trim(), join(root, "server", "python", "worker.py"));
  } finally {
    if (prior === undefined) delete process.env.BOTCRAFT_APP_ROOT;
    else process.env.BOTCRAFT_APP_ROOT = prior;
    rmSync(temporary, { recursive: true, force: true });
  }
});
