/**
 * @fileoverview Тесты выбора Redis исполнителей: оба состояния WORKER_RUNNER_REDIS_REQUIRED
 * @module server/bots/resolveRunnerRedisUrl.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { resolveRunnerRedisUrl } from "./resolveRunnerRedisUrl";

describe("resolveRunnerRedisUrl", () => {
  it("без флага берёт WORKER_RUNNER_REDIS_URL или REDIS_URL панели", () => {
    assert.strictEqual(
      resolveRunnerRedisUrl({ WORKER_RUNNER_REDIS_URL: " redis://runners ", REDIS_URL: "redis://panel" }),
      "redis://runners",
    );
    assert.strictEqual(resolveRunnerRedisUrl({ REDIS_URL: "redis://panel" }), "redis://panel");
    assert.strictEqual(
      resolveRunnerRedisUrl({ WORKER_RUNNER_REDIS_REQUIRED: "false", REDIS_URL: " redis://panel " }),
      "redis://panel",
    );
    assert.throws(
      () => resolveRunnerRedisUrl({}),
      /WORKER_RUNNER_REDIS_URL или REDIS_URL/,
    );
  });

  it("при true/1/yes берёт только WORKER_RUNNER_REDIS_URL", () => {
    for (const flag of ["true", "1", "yes", " YES "]) {
      assert.strictEqual(
        resolveRunnerRedisUrl({
          WORKER_RUNNER_REDIS_REQUIRED: flag,
          WORKER_RUNNER_REDIS_URL: "redis://runners",
          REDIS_URL: "redis://panel",
        }),
        "redis://runners",
        flag,
      );
    }
  });

  it("при включённом флаге пустой адрес — ошибка, REDIS_URL панели не используется", () => {
    for (const dedicated of [undefined, "", "  "]) {
      assert.throws(
        () => resolveRunnerRedisUrl({
          WORKER_RUNNER_REDIS_REQUIRED: "true",
          WORKER_RUNNER_REDIS_URL: dedicated,
          REDIS_URL: "redis://panel",
        }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(error.message, /WORKER_RUNNER_REDIS_URL/);
          assert.ok(!error.message.includes("redis://panel"));
          return true;
        },
      );
    }
  });
});
