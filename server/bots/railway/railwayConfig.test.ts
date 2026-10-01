/**
 * @fileoverview Тесты настроек Railway и выбора места запуска ботов проекта
 * @module server/bots/railway/railwayConfig.test
 */

import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { getProjectPlacement } from "../botPlacement";
import { getRailwayConfig, isRailwayProject, railwayBotEnvDefaults } from "./railwayConfig";

describe("railwayConfig", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("список проектов разбирается с пробелами и мусором", () => {
    process.env.WORKER_RAILWAY_PROJECTS = " 1, 5 ,abc,-3";
    assert.strictEqual(isRailwayProject(1), true);
    assert.strictEqual(isRailwayProject(5), true);
    assert.strictEqual(isRailwayProject(3), false);
  });

  it("без обязательных переменных — понятная ошибка", () => {
    assert.throws(() => getRailwayConfig({}), /RAILWAY_API_TOKEN или RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID/);
  });

  it("токен проекта идёт отдельным заголовком, workspace — Bearer", () => {
    const base = { RAILWAY_PROJECT_ID: "p", RAILWAY_ENVIRONMENT_ID: "e" };
    assert.strictEqual(getRailwayConfig({ ...base, RAILWAY_TOKEN: "t" }).projectToken, true);
    const workspace = getRailwayConfig({ ...base, RAILWAY_TOKEN: "t", RAILWAY_API_TOKEN: "w" });
    assert.strictEqual(workspace.projectToken, false);
    assert.strictEqual(workspace.apiToken, "w");
    assert.strictEqual(workspace.runnerRedisUrl, "${{Redis.REDIS_URL}}");
    assert.strictEqual(workspace.region, "");
    assert.strictEqual(getRailwayConfig({ ...base, RAILWAY_TOKEN: "t", RAILWAY_REGION: " europe-west4-drams3a " }).region, "europe-west4-drams3a");
  });

  it("адреса БД и Redis для ботов берутся из RAILWAY_BOT_*", () => {
    assert.deepStrictEqual(railwayBotEnvDefaults({ RAILWAY_BOT_DATABASE_URL: " pg ", RAILWAY_BOT_REDIS_URL: "" }), { DATABASE_URL: "pg" });
  });
});

describe("getProjectPlacement", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("Railway важнее общего режима, остальные проекты — как раньше", () => {
    process.env.WORKER_RUNTIME = "docker";
    process.env.WORKER_RAILWAY_PROJECTS = "1";
    assert.deepStrictEqual(getProjectPlacement(1), { runnerId: "railway-p1", railwayProjectId: 1 });
    assert.deepStrictEqual(getProjectPlacement(2), { runnerId: null, railwayProjectId: null });
    process.env.WORKER_RUNTIME = "remote";
    process.env.WORKER_RUNNER_ID = "r1";
    assert.deepStrictEqual(getProjectPlacement(2), { runnerId: "r1", railwayProjectId: null });
  });
});
