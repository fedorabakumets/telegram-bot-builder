/**
 * @fileoverview Тест переноса кэша байткода на копию папки бота
 * @module server/bots/retargetBotCodeCache.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { retargetBotCodeCache } from "./retargetBotCodeCache";

describe("retargetBotCodeCache", () => {
  it("имя кэша в копии совпадает с размером и st_mtime_ns скопированного файла", () => {
    const root = mkdtempSync(join(tmpdir(), "botcode-"));
    const source = join(root, "src");
    mkdirSync(join(source, ".botcode"), { recursive: true });
    const bot = join(source, "bot.py");
    writeFileSync(bot, "print('hi')\n");
    const st = statSync(bot, { bigint: true });
    writeFileSync(join(source, ".botcode", `bot.cb0d0d0a.${st.size}.${st.mtimeNs}.bin`), "x");

    const copy = join(root, "copy");
    cpSync(source, copy, { recursive: true });
    assert.strictEqual(retargetBotCodeCache(bot, join(copy, "bot.py")), true);

    const copied = statSync(join(copy, "bot.py"), { bigint: true });
    assert.deepStrictEqual(readdirSync(join(copy, ".botcode")), [`bot.cb0d0d0a.${copied.size}.${copied.mtimeNs}.bin`]);
  });

  it("без кэша ничего не делает", () => {
    const root = mkdtempSync(join(tmpdir(), "botcode-"));
    writeFileSync(join(root, "bot.py"), "x");
    assert.strictEqual(retargetBotCodeCache(join(root, "bot.py"), join(root, "bot.py")), false);
  });
});
