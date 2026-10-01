/**
 * @fileoverview Тесты сборки `docker run` для воркера и настроек WORKER_RUNTIME
 * @module server/bots/workerDockerArgs.test
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { buildDockerWorkerCommand, dockerWorkerName, toHostPath } from "./workerDockerArgs";
import { getDockerWorkerConfig, getWorkerRuntime, parseEnvNameList, type DockerWorkerConfig } from "./workerRuntime";
import { resolveBotEnvReference } from "./resolveBotEnvReference";

/** Переменные, которые тесты меняют и восстанавливают */
const TOUCHED = ["WORKER_RUNTIME", "WORKER_ENV_PASSTHROUGH", "WORKER_DOCKER_NETWORK", "WORKER_MEMORY_LIMIT"];

/** Настройки контейнера для тестов */
const config: DockerWorkerConfig = {
  image: "tbb-worker:test",
  python: "python3",
  network: "host",
  memory: "256m",
  cpus: "0.5",
  user: "1000:1000",
  hostRoot: "",
  envPassthrough: ["OPENAI_API_KEY"],
};

/** Пути приложения для тестов */
const paths = { appRoot: "/srv/app", pythonDir: "/srv/app/server/python", stagedBotsDir: "/srv/app/.worker-runtime/tbb-worker-7/bots" };

/**
 * Возвращает значения флага из аргументов docker
 * @param args - Аргументы docker run
 * @param flag - Имя флага
 * @returns все значения флага по порядку
 */
function flagValues(args: string[], flag: string): string[] {
  return args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
}

describe("workerDockerArgs", () => {
  const saved = Object.fromEntries(TOUCHED.map((k) => [k, process.env[k]]));
  beforeEach(() => TOUCHED.forEach((k) => delete process.env[k]));
  afterEach(() => TOUCHED.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));

  it("по умолчанию воркеры — обычные процессы", () => {
    assert.strictEqual(getWorkerRuntime(), "process");
    process.env.WORKER_RUNTIME = " Docker ";
    assert.strictEqual(getWorkerRuntime(), "docker");
  });

  it("секреты сервера не попадают в контейнер, разрешённые — только по имени", () => {
    const serverEnv = { DATABASE_URL: "postgres://secret", SESSION_SECRET: "s", OPENAI_API_KEY: "sk-1", TZ: "Europe/Moscow" };
    const cmd = buildDockerWorkerCommand(7, [1, 2], config, paths, serverEnv);
    const passed = flagValues(cmd.args, "-e");
    assert.ok(!passed.includes("DATABASE_URL") && !passed.includes("SESSION_SECRET"));
    assert.ok(passed.includes("OPENAI_API_KEY") && passed.includes("TZ"));
    assert.strictEqual(cmd.env.OPENAI_API_KEY, "sk-1");
    assert.ok(!cmd.args.some((a) => a.includes("sk-1")), "значения не должны светиться в аргументах процесса");
  });

  it("монтирует только uploads своих проектов и папки ботов только для чтения", () => {
    const mounts = flagValues(buildDockerWorkerCommand(7, [1, 2], config, paths, {}).args, "-v");
    assert.deepStrictEqual(mounts, [
      "/srv/app/server/python:/opt/worker:ro",
      "/srv/app/.worker-runtime/tbb-worker-7/bots:/app/bots:ro",
      "/srv/app/uploads/1:/app/uploads/1",
      "/srv/app/uploads/2:/app/uploads/2",
    ]);
    const shared = flagValues(buildDockerWorkerCommand(0, null, config, paths, {}).args, "-v");
    assert.ok(shared.includes("/srv/app/uploads:/app/uploads"));
  });

  it("лимиты, сеть и ограничения прав", () => {
    const { args, name } = buildDockerWorkerCommand(-5, [5], config, paths, {});
    assert.strictEqual(name, "tbb-worker-p5");
    assert.deepStrictEqual(flagValues(args, "--memory"), ["256m"]);
    assert.deepStrictEqual(flagValues(args, "--cpus"), ["0.5"]);
    assert.deepStrictEqual(flagValues(args, "--network"), ["host"]);
    assert.deepStrictEqual(flagValues(args, "--cap-drop"), ["ALL"]);
    assert.ok(args.includes("--read-only"));
    assert.deepStrictEqual(args.slice(-4), ["tbb-worker:test", "python3", "-u", "/opt/worker/worker.py"]);
  });

  it("пути переводятся на хост, когда сервер сам в контейнере", () => {
    assert.strictEqual(toHostPath("/app/uploads/3", "/app", "/opt/telegram-bot-builder"), "/opt/telegram-bot-builder/uploads/3");
    assert.strictEqual(toHostPath("/etc/x", "/app", "/opt/tbb"), "/etc/x");
    assert.strictEqual(dockerWorkerName(1612141295), "tbb-worker-1612141295");
  });

  it("настройки из переменных и разбор списка имён", () => {
    process.env.WORKER_DOCKER_NETWORK = "telegram-bot-builder_default";
    process.env.WORKER_ENV_PASSTHROUGH = "OPENAI_API_KEY, bad-name, ,TZ";
    const cfg = getDockerWorkerConfig();
    assert.strictEqual(cfg.network, "telegram-bot-builder_default");
    assert.strictEqual(cfg.memory, "");
    assert.deepStrictEqual(cfg.envPassthrough, ["OPENAI_API_KEY", "TZ"]);
    assert.deepStrictEqual(parseEnvNameList(undefined), []);
  });

  it("${{VAR}}: в режиме docker раскрываются только разрешённые переменные", () => {
    const env = { SESSION_SECRET: "s", OPENAI_API_KEY: "sk-1" };
    assert.strictEqual(resolveBotEnvReference("${{SESSION_SECRET}}", env), "s");
    process.env.WORKER_RUNTIME = "docker";
    process.env.WORKER_ENV_PASSTHROUGH = "OPENAI_API_KEY";
    assert.strictEqual(resolveBotEnvReference("${{SESSION_SECRET}}", env), "${{SESSION_SECRET}}");
    assert.strictEqual(resolveBotEnvReference("${{OPENAI_API_KEY}}", env), "sk-1");
    assert.strictEqual(resolveBotEnvReference("plain", env), "plain");
  });
});
