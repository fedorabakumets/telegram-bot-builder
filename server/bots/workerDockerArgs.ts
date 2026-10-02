/**
 * @fileoverview Сборка аргументов `docker run` для контейнера Python-воркера.
 * Контейнер видит только код воркера, копии папок своих ботов (только чтение)
 * и uploads своих проектов; переменные сервера в него не попадают.
 * @module server/bots/workerDockerArgs
 */

import { join, relative, isAbsolute } from "node:path";
import type { DockerWorkerConfig } from "./workerRuntime";
import { canShareServerEnv } from "./botEnvPolicy";

/** Корень приложения внутри контейнера: боты ищут uploads как ../../uploads */
export const CONTAINER_APP_ROOT = "/app";

/** Каталог кода воркера внутри контейнера */
export const CONTAINER_WORKER_DIR = "/opt/worker";

/** Переменные воркера, которые передаются в контейнер, если заданы на сервере */
const WORKER_TUNING_ENV = ["AIOGRAM_LAZY_MODELS", "BOT_CODE_CACHE", "TZ"];

/** Локальные пути, нужные контейнеру */
export interface DockerWorkerPaths {
  /** Корень приложения на сервере (process.cwd()) */
  appRoot: string;
  /** Каталог server/python с worker.py */
  pythonDir: string;
  /** Каталог с копиями папок ботов этого воркера */
  stagedBotsDir: string;
}

/** Готовая команда запуска контейнера */
export interface DockerWorkerCommand {
  /** Имя контейнера */
  name: string;
  /** Аргументы для `docker` */
  args: string[];
  /** Переменные, которые docker CLI возьмёт по имени (-e NAME) */
  env: Record<string, string>;
}

/**
 * Имя контейнера воркера по ключу (ключ без владельца отрицательный)
 * @param workerKey - Ключ воркера
 * @returns имя вида tbb-worker-12 или tbb-worker-p5
 */
export function dockerWorkerName(workerKey: number): string {
  return workerKey < 0 ? `tbb-worker-p${-workerKey}` : `tbb-worker-${workerKey}`;
}

/**
 * Переводит локальный путь в путь на хосте Docker (когда сервер сам в контейнере)
 * @param localPath - Путь на сервере
 * @param appRoot - Корень приложения на сервере
 * @param hostRoot - Корень приложения на хосте, пусто — пути совпадают
 * @returns путь для -v
 */
export function toHostPath(localPath: string, appRoot: string, hostRoot: string): string {
  if (!hostRoot) return localPath;
  const rel = relative(appRoot, localPath);
  if (rel.startsWith("..") || isAbsolute(rel)) return localPath;
  return join(hostRoot, rel);
}

/**
 * Собирает аргументы `docker run` для воркера
 * @param workerKey - Ключ воркера
 * @param projectIds - Проекты, чьи uploads монтируются; null — весь каталог uploads
 * @param config - Настройки из переменных окружения
 * @param paths - Локальные пути
 * @param serverEnv - Окружение сервера, из которого берутся разрешённые переменные
 * @returns имя, аргументы и окружение для docker CLI
 */
export function buildDockerWorkerCommand(
  workerKey: number,
  projectIds: number[] | null,
  config: DockerWorkerConfig,
  paths: DockerWorkerPaths,
  serverEnv: NodeJS.ProcessEnv = process.env,
): DockerWorkerCommand {
  const host = (p: string) => toHostPath(p, paths.appRoot, config.hostRoot);
  const name = dockerWorkerName(workerKey);
  const env: Record<string, string> = {
    PROJECT_ID: String(workerKey),
    PYTHONUNBUFFERED: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    HOME: "/tmp",
    WORKER_REPORT_MEMORY: "true",
  };
  // Denylist (botEnvPolicy) действует и на WORKER_ENV_PASSTHROUGH
  const shared = config.envPassthrough.filter((key) => canShareServerEnv(key, config.envPassthrough));
  for (const key of [...WORKER_TUNING_ENV, ...shared]) {
    const value = serverEnv[key];
    if (value !== undefined) env[key] = value;
  }

  const args = [
    "run", "-i", "--rm", "--name", name, "--label", `tbb.worker=${workerKey}`,
    "--network", config.network,
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
    "--pids-limit", "256", "--read-only", "--tmpfs", "/tmp:rw,size=64m",
    "-w", CONTAINER_APP_ROOT,
  ];
  if (config.user) args.push("--user", config.user);
  if (config.memory) args.push("--memory", config.memory, "--memory-swap", config.memory);
  if (config.cpus) args.push("--cpus", config.cpus);

  args.push("-v", `${host(paths.pythonDir)}:${CONTAINER_WORKER_DIR}:ro`);
  args.push("-v", `${host(paths.stagedBotsDir)}:${CONTAINER_APP_ROOT}/bots:ro`);
  const uploads = join(paths.appRoot, "uploads");
  if (projectIds === null) {
    args.push("-v", `${host(uploads)}:${CONTAINER_APP_ROOT}/uploads`);
  } else {
    for (const id of projectIds) {
      args.push("-v", `${host(join(uploads, String(id)))}:${CONTAINER_APP_ROOT}/uploads/${id}`);
    }
  }
  for (const key of Object.keys(env)) args.push("-e", key);
  args.push(config.image, config.python, "-u", `${CONTAINER_WORKER_DIR}/worker.py`);
  return { name, args, env };
}
