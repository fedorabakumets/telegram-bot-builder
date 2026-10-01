/**
 * @fileoverview Тесты сведений исполнителя о площадке: сборка из окружения и запись в Redis
 * @module server/redis/runnerSiteInfo.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { listRunnerSiteInfos, publishRunnerSiteInfo, readRunnerSiteInfo, RUNNER_REGISTRY_KEY, runnerInfoKey } from "./runnerSiteInfo";

describe("readRunnerSiteInfo", () => {
  it("на Railway берёт регион и адреса площадки", () => {
    const info = readRunnerSiteInfo("site", {
      RAILWAY_REPLICA_ID: "r",
      RAILWAY_REPLICA_REGION: "europe-west4",
      RUNNER_BOT_DATABASE_URL: "postgresql://inner",
      RUNNER_DATABASE_PUBLIC_URL: " postgresql://outer ",
      RUNNER_BOT_REDIS_URL: "",
    });
    assert.strictEqual(info.platform, "railway");
    assert.strictEqual(info.region, "europe-west4");
    assert.strictEqual(info.botDatabaseUrl, "postgresql://inner");
    assert.strictEqual(info.databasePublicUrl, "postgresql://outer");
    assert.strictEqual(info.botRedisUrl, undefined);
  });

  it("без Railway считает площадку Docker", () => {
    assert.strictEqual(readRunnerSiteInfo("x", { RAILWAY_PROJECT_ID: "p" }).platform, "docker");
  });
});

describe("publishRunnerSiteInfo", { skip: !process.env.TEST_REDIS_URL }, () => {
  it("регистрирует исполнителя и отдаёт его сведения", async () => {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(process.env.TEST_REDIS_URL!);
    const id = `test-${Date.now()}`;
    try {
      await publishRunnerSiteInfo(redis, readRunnerSiteInfo(id, { RUNNER_BOT_DATABASE_URL: "postgresql://db" }));
      const found = (await listRunnerSiteInfos(redis)).find((info) => info.runnerId === id);
      assert.strictEqual(found?.botDatabaseUrl, "postgresql://db");
    } finally {
      await redis.multi().del(runnerInfoKey(id)).srem(RUNNER_REGISTRY_KEY, id).exec();
      redis.disconnect();
    }
  });
});
