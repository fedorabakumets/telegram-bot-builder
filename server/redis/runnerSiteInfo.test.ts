/**
 * @fileoverview Тесты сведений исполнителя о площадке: сборка из окружения и запись в Redis
 * @module server/redis/runnerSiteInfo.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { listRunnerSiteInfos, publishRunnerSiteInfo, readRunnerSiteInfo, RUNNER_REGISTRY_KEY, RUNNER_SITE_INFO_VERSION, runnerInfoKey, type RunnerSiteInfo } from "./runnerSiteInfo";

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

  it("без флага пишет адреса целиком и не повышает версию формата", () => {
    const secret = "postgresql://user:s3cret@db/app";
    for (const flag of [undefined, "", "false", "0", "no"]) {
      const info = readRunnerSiteInfo("site", {
        RUNNER_SITE_INFO_HIDE_URLS: flag,
        RUNNER_BOT_DATABASE_URL: secret,
        RUNNER_DATABASE_PUBLIC_URL: "postgresql://outer",
        RUNNER_BOT_REDIS_URL: "redis://bots",
      });
      assert.strictEqual(info.v, RUNNER_SITE_INFO_VERSION);
      assert.strictEqual(info.botDatabaseUrl, secret);
      assert.strictEqual(info.databasePublicUrl, "postgresql://outer");
      assert.strictEqual(info.botRedisUrl, "redis://bots");
    }
  });

  it("при true/1/yes не пишет три адреса, остальные поля остаются", () => {
    const secret = "user:s3cret";
    for (const flag of ["true", "1", "yes", " YES "]) {
      const info = readRunnerSiteInfo("site", {
        RUNNER_SITE_INFO_HIDE_URLS: flag,
        RAILWAY_REPLICA_ID: "r",
        RAILWAY_REPLICA_REGION: "europe-west4",
        RUNNER_BOT_DATABASE_URL: `postgresql://${secret}@inner/db`,
        RUNNER_DATABASE_PUBLIC_URL: `postgresql://${secret}@outer/db`,
        RUNNER_BOT_REDIS_URL: `redis://${secret}@redis`,
      });
      assert.strictEqual(info.v, RUNNER_SITE_INFO_VERSION);
      assert.strictEqual(info.runnerId, "site");
      assert.strictEqual(info.platform, "railway");
      assert.strictEqual(info.region, "europe-west4");
      assert.ok(info.startedAt);
      assert.ok(!("botDatabaseUrl" in info) && !("databasePublicUrl" in info) && !("botRedisUrl" in info));
      assert.ok(!JSON.stringify(info).includes(secret));
    }
  });

  it("запись без адресов и старая запись с адресами читаются", () => {
    const hidden = JSON.parse(JSON.stringify(readRunnerSiteInfo("new", {
      RUNNER_SITE_INFO_HIDE_URLS: "true",
      RUNNER_BOT_DATABASE_URL: "postgresql://user:s3cret@db/app",
    }))) as RunnerSiteInfo;
    assert.strictEqual(hidden.runnerId, "new");
    assert.strictEqual(hidden.botDatabaseUrl, undefined);

    const stored = "{\"v\":1,\"runnerId\":\"old\",\"platform\":\"docker\",\"region\":\"eu\",\"botDatabaseUrl\":\"postgresql://keep\",\"startedAt\":\"2020-01-01T00:00:00.000Z\"}";
    const old = JSON.parse(stored) as RunnerSiteInfo;
    assert.strictEqual(old.runnerId, "old");
    assert.strictEqual(old.region, "eu");
    assert.strictEqual(old.botDatabaseUrl, "postgresql://keep");
    assert.strictEqual(old.databasePublicUrl, undefined);
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
