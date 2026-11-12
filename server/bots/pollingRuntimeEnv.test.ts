/** @fileoverview Проверки адресной передачи настроек polling без расширения доступа к секретам. */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withPollingRuntimeEnv, POLLING_RUNTIME_ENV } from "./pollingRuntimeEnv";
import { buildWorkerBaseEnv } from "./workerBaseEnv";
import { buildDockerWorkerCommand } from "./workerDockerArgs";

/** Безопасные настройки и секреты, которые не должны наследоваться. */
const env = {
  BOT_POLLING_MODE: "process", BOT_ON_DEMAND_TOKEN_IDS: "31,32",
  BOT_ON_DEMAND_IDLE_SECONDS: "30", BOT_ON_DEMAND_MAX_ACTIVE: "4",
  REDIS_URL: "redis://private", DATABASE_URL: "postgresql://private", ADMIN_API_KEY: "secret",
};

describe("настройки общего polling", () => {
  it("дополняет окружение бота только разрешёнными именами", () => {
    const input = [{ key: "BOT_POLLING_MODE", value: "direct" }];
    const actual = withPollingRuntimeEnv(input, env);
    assert.equal(actual.find((entry) => entry.key === "BOT_POLLING_MODE")?.value, "direct");
    assert.equal(actual.find((entry) => entry.key === "BOT_ON_DEMAND_TOKEN_IDS")?.value, "");
    assert.equal(actual.length, 4);
    assert.equal(input.length, 1);
    assert.deepEqual(actual.map((entry) => entry.key).sort(), [...POLLING_RUNTIME_ENV].sort());
  });

  it("явный режим бота перекрывает общий список пробного включения", () => {
    for (const mode of ["ondemand", "process"]) {
      const actual = withPollingRuntimeEnv([{ key: "BOT_POLLING_MODE", value: mode }], env);
      assert.equal(actual.find((entry) => entry.key === "BOT_ON_DEMAND_TOKEN_IDS")?.value, "");
    }
    const inherited = withPollingRuntimeEnv([], env);
    assert.equal(inherited.find((entry) => entry.key === "BOT_ON_DEMAND_TOKEN_IDS")?.value, "31,32");
  });

  it("сохраняет собственный адресный список и очищенный список после разбора файла", () => {
    const actual = withPollingRuntimeEnv([
      { key: "BOT_POLLING_MODE", value: "process" },
      { key: "BOT_ON_DEMAND_TOKEN_IDS", value: "35" },
    ], env);
    assert.equal(actual.find((entry) => entry.key === "BOT_ON_DEMAND_TOKEN_IDS")?.value, "35");
  });

  it("не подставляет настройки при отсутствии явной конфигурации", () => {
    assert.deepEqual(withPollingRuntimeEnv([], {}), []);
    assert.deepEqual(withPollingRuntimeEnv([], { BOT_POLLING_MODE: "  " }), []);
  });

  it("передаёт настройки процессу, сохраняя запрет наследования подключений", () => {
    const result = buildWorkerBaseEnv(env, { passthrough: [] });
    assert.deepEqual(result, Object.fromEntries(POLLING_RUNTIME_ENV.map((key) => [key, env[key as keyof typeof env]])));
  });

  it("передаёт настройки Docker по именам без значений в аргументах", () => {
    const result = buildDockerWorkerCommand(1, [1], {
      image: "worker:test", python: "python3", network: "host", memory: "", cpus: "",
      user: "", hostRoot: "", envPassthrough: [],
    }, { appRoot: "/app", pythonDir: "/app/server/python", stagedBotsDir: "/app/bots" }, env);
    for (const key of POLLING_RUNTIME_ENV) {
      assert.equal(result.env[key], env[key as keyof typeof env]);
      assert.ok(result.args.includes(key));
    }
    assert.equal(result.env.REDIS_URL, undefined);
    assert.equal(result.env.ADMIN_API_KEY, undefined);
    assert.ok(!result.args.includes("process"));
  });
});
