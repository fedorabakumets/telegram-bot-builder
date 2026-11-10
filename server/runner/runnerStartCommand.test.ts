/**
 * @fileoverview Проверка причины отказа при просроченной ссылке на сборку.
 * @module server/runner/runnerStartCommand.test
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareWorkerLine } from "./runnerStartCommand";

test("HTTP 403 помечает ссылку на сборку как просроченную", async () => {
  const command = JSON.stringify({ cmd: "start_bot", token_id: 3, build: {
    url: "https://example.invalid/build", sha256: "a".repeat(64), size: 1,
    fingerprint: "b".repeat(32), file_name: "bot.py",
  } });
  const result = await prepareWorkerLine(command, "unused", async () => {
    throw new Error("HTTP 403 при скачивании сборки");
  });
  assert.ok("error" in result);
  assert.match(result.error, /^TBB_BUILD_LINK_EXPIRED:/);
});
