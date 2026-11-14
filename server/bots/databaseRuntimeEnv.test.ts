/** @fileoverview Проверки передачи таймаута пула без наследования секретов панели. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withDatabaseRuntimeEnv } from "./databaseRuntimeEnv";
import { buildWorkerBaseEnv } from "./workerBaseEnv";
import { buildDockerWorkerCommand } from "./workerDockerArgs";

/** Окружение площадки с безопасной настройкой и запрещёнными подключениями. */
const env = { BOT_DB_POOL_IDLE_SECONDS: "45", DATABASE_URL: "postgresql://private",
  REDIS_URL: "redis://private", ADMIN_API_KEY: "secret" };

describe("настройка простоя пула БД", () => {
  it("передаёт настройку в словарь бота для удалённого запуска", () => {
    assert.deepEqual(withDatabaseRuntimeEnv([], env), [{ key: "BOT_DB_POOL_IDLE_SECONDS", value: "45" }]);
    assert.deepEqual(withDatabaseRuntimeEnv([], {}), []);
    assert.deepEqual(withDatabaseRuntimeEnv([], { BOT_DB_POOL_IDLE_SECONDS: "  " }), []);
  });

  it("сохраняет явное значение бота и исходный список", () => {
    const own = [{ key: "BOT_DB_POOL_IDLE_SECONDS", value: "120" }];
    assert.deepEqual(withDatabaseRuntimeEnv(own, env), own);
    assert.notEqual(withDatabaseRuntimeEnv(own, env), own);
    assert.deepEqual(withDatabaseRuntimeEnv([{ key: "BOT_DB_POOL_IDLE_SECONDS", value: "" }], env),
      [{ key: "BOT_DB_POOL_IDLE_SECONDS", value: "" }]);
  });

  it("передаёт настройку локальному воркеру без подключений панели", () => {
    assert.deepEqual(buildWorkerBaseEnv(env, { passthrough: [] }), { BOT_DB_POOL_IDLE_SECONDS: "45" });
  });

  it("передаёт настройку Docker только по имени", () => {
    const result = buildDockerWorkerCommand(1, [1], {
      image: "worker:test", python: "python3", network: "host", memory: "", cpus: "",
      user: "", hostRoot: "", envPassthrough: [],
    }, { appRoot: "/app", pythonDir: "/app/server/python", stagedBotsDir: "/app/bots" }, env);
    assert.equal(result.env.BOT_DB_POOL_IDLE_SECONDS, "45");
    assert.ok(result.args.includes("BOT_DB_POOL_IDLE_SECONDS"));
    assert.ok(!result.args.includes("45"));
    assert.equal(result.env.DATABASE_URL, undefined);
    assert.equal(result.env.REDIS_URL, undefined);
    assert.equal(result.env.ADMIN_API_KEY, undefined);
  });
});
