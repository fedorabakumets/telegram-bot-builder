/**
 * @fileoverview Тесты политики передачи серверных переменных ботам и базового окружения воркера
 * @module server/bots/botEnvPolicy.test
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { canShareServerEnv, getShareableServerEnvKeys, isServerEnvDenied } from "./botEnvPolicy";
import { buildWorkerBaseEnv } from "./workerBaseEnv";
import { resolveBotEnvReference, resolveBotEnvVariables } from "./resolveBotEnvReference";

/** Окружение сервера с секретами для проверок */
const serverEnv: NodeJS.ProcessEnv = {
  PATH: "/usr/bin",
  HOME: "/root",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  PYTHONUNBUFFERED: "1",
  PYTHON_SECRET_TOKEN: "x",
  SESSION_SECRET: "s",
  ADMIN_API_KEY: "admin",
  PGPASSWORD: "pg",
  RAILWAY_API_TOKEN: "rw",
  TELEGRAM_BOT_TOKEN: "tg",
  DATABASE_URL: "postgres://db",
  REDIS_URL: "redis://r",
  API_BASE_URL: "https://studio",
  BOT_CODE_CACHE: "false",
  OPENAI_API_KEY: "sk-1",
  STRIPE_SECRET_KEY: "sk-live",
  WORKER_ENV_PASSTHROUGH: "OPENAI_API_KEY,SESSION_SECRET,STRIPE_SECRET_KEY,PGHOST,MISSING_VAR",
};

describe("botEnvPolicy", () => {
  const saved = process.env.WORKER_ENV_PASSTHROUGH;
  beforeEach(() => delete process.env.WORKER_ENV_PASSTHROUGH);
  afterEach(() => (saved === undefined ? delete process.env.WORKER_ENV_PASSTHROUGH : (process.env.WORKER_ENV_PASSTHROUGH = saved)));

  it("denylist: точные имена, префиксы и подстроки без учёта регистра", () => {
    for (const name of ["SESSION_SECRET", "ADMIN_API_KEY", "DATABASE_URL", "REDIS_URL", "PGHOST", "pgpassword",
      "RAILWAY_TOKEN", "RUNNER_BOT_DATABASE_URL", "GOOGLE_CLIENT_SECRET", "SMTP_PASSWORD", "JWT_PRIVATE_KEY",
      "WORKER_RUNNER_REDIS_URL", "TELEGRAM_BOT_TOKEN"]) {
      assert.ok(isServerEnvDenied(name), name);
    }
    for (const name of ["OPENAI_API_KEY", "WEBHOOK_BASE_URL", "TZ", "STUDIO_BOT_MANAGER_TOKEN"]) {
      assert.ok(!isServerEnvDenied(name), name);
    }
  });

  it("делиться можно только именами из passthrough вне denylist", () => {
    assert.ok(canShareServerEnv("OPENAI_API_KEY", ["OPENAI_API_KEY"]));
    assert.ok(!canShareServerEnv("OPENAI_API_KEY", []));
    assert.ok(!canShareServerEnv("SESSION_SECRET", ["SESSION_SECRET"]));
  });

  it("ключи для UI: passthrough минус denylist, только заданные", () => {
    assert.deepStrictEqual(getShareableServerEnvKeys(serverEnv), ["OPENAI_API_KEY"]);
    assert.deepStrictEqual(getShareableServerEnvKeys({}), []);
  });

  it("базовое окружение воркера без секретов панели", () => {
    const env = buildWorkerBaseEnv(serverEnv);
    for (const key of ["SESSION_SECRET", "ADMIN_API_KEY", "PGPASSWORD", "RAILWAY_API_TOKEN", "TELEGRAM_BOT_TOKEN",
      "STRIPE_SECRET_KEY", "PYTHON_SECRET_TOKEN", "WORKER_ENV_PASSTHROUGH"]) {
      assert.ok(!(key in env), key);
    }
    for (const key of ["PATH", "HOME", "LANG", "LC_ALL", "PYTHONUNBUFFERED", "DATABASE_URL", "REDIS_URL",
      "API_BASE_URL", "BOT_CODE_CACHE", "OPENAI_API_KEY"]) {
      assert.strictEqual(env[key], serverEnv[key], key);
    }
  });

  it("исполнитель не отдаёт боту свои подключения", () => {
    const env = buildWorkerBaseEnv(serverEnv, { includeConnections: false, passthrough: [] });
    assert.ok(!("REDIS_URL" in env) && !("DATABASE_URL" in env) && !("OPENAI_API_KEY" in env));
    assert.strictEqual(env.PATH, "/usr/bin");
  });

  it("${{VAR}} в режиме process: секреты не раскрываются, разрешённые — да", () => {
    assert.strictEqual(resolveBotEnvReference("${{SESSION_SECRET}}", serverEnv), "${{SESSION_SECRET}}");
    assert.strictEqual(resolveBotEnvReference("${{OPENAI_API_KEY}}", serverEnv), "${{OPENAI_API_KEY}}");
    process.env.WORKER_ENV_PASSTHROUGH = "OPENAI_API_KEY,SESSION_SECRET";
    assert.strictEqual(resolveBotEnvReference("${{OPENAI_API_KEY}}", serverEnv), "sk-1");
    assert.strictEqual(resolveBotEnvReference("${{SESSION_SECRET}}", serverEnv), "${{SESSION_SECRET}}");
  });

  it("нераскрытые ссылки в DATABASE_URL/REDIS_URL отбрасываются, остальные остаются текстом", () => {
    const vars = resolveBotEnvVariables([
      { key: "DATABASE_URL", value: "${{DATABASE_URL}}" },
      { key: "REDIS_URL", value: "redis://own" },
      { key: "X", value: "${{SESSION_SECRET}}" },
    ], serverEnv);
    assert.deepStrictEqual(vars, [{ key: "REDIS_URL", value: "redis://own" }, { key: "X", value: "${{SESSION_SECRET}}" }]);
  });
});
