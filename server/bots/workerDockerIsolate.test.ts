/**
 * @fileoverview Изоляция Docker-воркера: сеть площадки и каталоги uploads.
 * При выключенных флагах аргументы совпадают с прежним поведением.
 * @module server/bots/workerDockerIsolate.test
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { buildDockerWorkerCommand } from "./workerDockerArgs";
import { getDockerWorkerConfig, type DockerWorkerConfig } from "./workerRuntime";
import { selectSharedUploadProjects, sharedUploadProjectIds } from "./workerSharedProjects";

/** Переменные, которые тесты меняют и восстанавливают */
const TOUCHED = [
  "WORKER_DOCKER_ISOLATE", "WORKER_DOCKER_NETWORK", "WORKER_DOCKER_BRIDGE_NAME",
  "WORKER_DOCKER_UPLOADS_READONLY", "WORKER_GROUPING",
];

/** Пути приложения для тестов */
const paths = {
  appRoot: "/srv/app",
  pythonDir: "/srv/app/server/python",
  stagedBotsDir: "/srv/app/.worker-runtime/tbb-worker-7/bots",
};

/** Базовые настройки контейнера: сеть host, как при выключенной изоляции */
const config: DockerWorkerConfig = {
  image: "tbb-worker:test", python: "python3", network: "host", memory: "", cpus: "",
  user: "", hostRoot: "", envPassthrough: [],
};

/**
 * Возвращает значения флага из аргументов docker
 * @param args - Аргументы docker run
 * @param flag - Имя флага
 * @returns все значения флага по порядку
 */
function flagValues(args: string[], flag: string): string[] {
  return args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
}

describe("workerDockerIsolate", () => {
  const saved = Object.fromEntries(TOUCHED.map((k) => [k, process.env[k]]));
  beforeEach(() => TOUCHED.forEach((k) => delete process.env[k]));
  afterEach(() => TOUCHED.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));

  it("флаги выключены — сеть host и прежние монтирования uploads", () => {
    assert.strictEqual(getDockerWorkerConfig().network, "host");
    process.env.WORKER_DOCKER_BRIDGE_NAME = "compose_net";
    assert.strictEqual(getDockerWorkerConfig().network, "host");
    const own = flagValues(buildDockerWorkerCommand(7, [1, 2], config, paths, {}).args, "-v");
    assert.deepStrictEqual(own.slice(-2), ["/srv/app/uploads/1:/app/uploads/1", "/srv/app/uploads/2:/app/uploads/2"]);
    const shared = flagValues(buildDockerWorkerCommand(0, null, config, paths, {}).args, "-v");
    assert.ok(shared.includes("/srv/app/uploads:/app/uploads"));
    assert.deepStrictEqual(flagValues(buildDockerWorkerCommand(0, null, config, paths, {}).args, "--network"), ["host"]);
    assert.strictEqual(selectSharedUploadProjects(false, 4, [9]), null);
  });

  it("изоляция без имени сети — ошибка, аргументы docker не строятся", () => {
    process.env.WORKER_DOCKER_ISOLATE = "yes";
    let built = false;
    assert.throws(() => {
      const cfg = getDockerWorkerConfig();
      built = true;
      return buildDockerWorkerCommand(0, null, cfg, paths, process.env);
    }, /WORKER_DOCKER_NETWORK/);
    assert.strictEqual(built, false);
  });

  it("изоляция с именем сети — эта сеть и без всего каталога uploads", () => {
    process.env.WORKER_DOCKER_ISOLATE = "1";
    process.env.WORKER_DOCKER_BRIDGE_NAME = "compose_net";
    process.env.WORKER_DOCKER_NETWORK = "explicit_net";
    assert.strictEqual(getDockerWorkerConfig().network, "explicit_net");
    delete process.env.WORKER_DOCKER_NETWORK;
    const cfg = getDockerWorkerConfig();
    assert.strictEqual(cfg.network, "compose_net");
    const cmd = buildDockerWorkerCommand(0, null, cfg, paths, process.env);
    const mounts = flagValues(cmd.args, "-v");
    assert.deepStrictEqual(flagValues(cmd.args, "--network"), ["compose_net"]);
    assert.ok(!mounts.includes("/srv/app/uploads:/app/uploads"));
    assert.deepStrictEqual(mounts, [
      "/srv/app/server/python:/opt/worker:ro",
      "/srv/app/.worker-runtime/tbb-worker-7/bots:/app/bots:ro",
    ]);
    const listed = flagValues(buildDockerWorkerCommand(0, [4, 9], cfg, paths, process.env).args, "-v");
    assert.ok(listed.includes("/srv/app/uploads/4:/app/uploads/4"));
    assert.ok(listed.includes("/srv/app/uploads/9:/app/uploads/9"));
    assert.deepStrictEqual(sharedUploadProjectIds(4, [9, 4, 0, -1]), [4, 9]);
    assert.deepStrictEqual(selectSharedUploadProjects(true, 0, []), []);
    const empty = flagValues(buildDockerWorkerCommand(0, [], cfg, paths, process.env).args, "-v");
    assert.ok(!empty.some((m) => m.includes("/uploads")));
  });

  it("readonly добавляет :ro и не меняет сеть", () => {
    process.env.WORKER_DOCKER_UPLOADS_READONLY = "true";
    const cfg = getDockerWorkerConfig();
    assert.strictEqual(cfg.network, "host");
    const mounts = flagValues(buildDockerWorkerCommand(7, [1], cfg, paths, process.env).args, "-v");
    assert.ok(mounts.includes("/srv/app/uploads/1:/app/uploads/1:ro"));
    assert.deepStrictEqual(flagValues(buildDockerWorkerCommand(7, [1], cfg, paths, process.env).args, "--network"), ["host"]);
    const whole = flagValues(buildDockerWorkerCommand(0, null, cfg, paths, process.env).args, "-v");
    assert.ok(whole.includes("/srv/app/uploads:/app/uploads:ro"));
    process.env.WORKER_DOCKER_ISOLATE = " YES ";
    process.env.WORKER_DOCKER_BRIDGE_NAME = "compose_net";
    const isolated = getDockerWorkerConfig();
    assert.strictEqual(isolated.network, "compose_net");
    const ro = flagValues(buildDockerWorkerCommand(0, [3], isolated, paths, process.env).args, "-v");
    assert.ok(ro.includes("/srv/app/uploads/3:/app/uploads/3:ro"));
    assert.deepStrictEqual(flagValues(buildDockerWorkerCommand(0, [3], isolated, paths, process.env).args, "--network"), ["compose_net"]);
  });
});
