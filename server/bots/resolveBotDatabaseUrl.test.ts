/**
 * @fileoverview Тесты решения, подставлять ли боту BOT_DATABASE_URL
 * @module server/bots/resolveBotDatabaseUrl.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { isBotRuntimeActive, resolveBotDatabaseUrl } from "./resolveBotDatabaseUrl";

const panel = "postgresql://panel:secret@localhost:5432/app";
const bot = "postgresql://bot_runtime:other@localhost:5432/app";

describe("resolveBotDatabaseUrl", () => {
  it("без флага оставляет DATABASE_URL панели, даже если адрес роли задан", () => {
    const decision = resolveBotDatabaseUrl({ DATABASE_URL: panel, BOT_DATABASE_URL: bot });
    assert.strictEqual(decision.useBotRuntime, false);
    assert.strictEqual(decision.databaseUrl, panel);
    assert.strictEqual(decision.warning, null);
    assert.strictEqual(isBotRuntimeActive({ DATABASE_URL: panel, BOT_DATABASE_URL: bot }), false);
  });

  it("включается значениями true/1/yes и подставляет BOT_DATABASE_URL", () => {
    for (const value of ["true", "TRUE", " 1 ", "yes"]) {
      const decision = resolveBotDatabaseUrl({
        BOT_RUNTIME_ENABLED: value,
        DATABASE_URL: panel,
        BOT_DATABASE_URL: ` ${bot} `,
      });
      assert.strictEqual(decision.useBotRuntime, true, value);
      assert.strictEqual(decision.databaseUrl, bot, value);
      assert.strictEqual(decision.warning, null, value);
    }
  });

  it("при включённом флаге и пустом адресе не переключает ботов и пишет предупреждение", () => {
    for (const value of [undefined, "", "   "]) {
      const decision = resolveBotDatabaseUrl({
        BOT_RUNTIME_ENABLED: "true",
        DATABASE_URL: panel,
        BOT_DATABASE_URL: value,
      });
      assert.strictEqual(decision.useBotRuntime, false);
      assert.strictEqual(decision.databaseUrl, panel);
      assert.ok(decision.warning?.includes("BOT_DATABASE_URL"));
      assert.strictEqual(isBotRuntimeActive({
        BOT_RUNTIME_ENABLED: "true",
        DATABASE_URL: panel,
        BOT_DATABASE_URL: value,
      }), false);
    }
  });

  it("прочие значения флага не включают роль", () => {
    for (const value of ["false", "0", "no", "on"]) {
      const decision = resolveBotDatabaseUrl({
        BOT_RUNTIME_ENABLED: value,
        DATABASE_URL: panel,
        BOT_DATABASE_URL: bot,
      });
      assert.strictEqual(decision.useBotRuntime, false, value);
      assert.strictEqual(decision.databaseUrl, panel, value);
    }
  });
});
