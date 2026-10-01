/**
 * @fileoverview Настройки исполнителя ботов (`npm run runner`): к какому Redis подключаться,
 * под каким ID принимать команды панели и чем запускать worker.py.
 * @module server/runner/runnerConfig
 */

import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Настройки исполнителя */
export interface RunnerConfig {
  /** ID исполнителя: панель отправляет ему воркеры при WORKER_RUNNER_ID с тем же значением */
  runnerId: string;
  /** Адрес Redis, общего с панелью */
  redisUrl: string;
  /** Python для worker.py */
  pythonPath: string;
  /** Путь к worker.py */
  workerScript: string;
  /** Каталог кеша скачанных сборок ботов */
  cacheDir: string;
  /** Сколько сборок держать в кеше */
  buildsKeep: number;
}

/**
 * Путь к worker.py рядом с исходниками исполнителя
 * @returns путь к `server/python/worker.py`
 * @throws Error в бандле без `import.meta.url` (образ исполнителя задаёт RUNNER_WORKER_SCRIPT)
 */
function defaultWorkerScript(): string {
  if (!import.meta.url) throw new Error("Задайте RUNNER_WORKER_SCRIPT — путь к worker.py");
  return join(dirname(fileURLToPath(import.meta.url)), "..", "python", "worker.py");
}

/**
 * Читает настройки из окружения
 * @param env - Переменные окружения
 * @returns настройки исполнителя
 * @throws Error, если не задан REDIS_URL
 */
export function loadRunnerConfig(env: NodeJS.ProcessEnv = process.env): RunnerConfig {
  const redisUrl = env.REDIS_URL?.trim();
  if (!redisUrl) throw new Error("Исполнителю нужен REDIS_URL (тот же Redis, что у панели)");
  return {
    runnerId: env.RUNNER_ID?.trim() || "default",
    redisUrl,
    pythonPath: env.RUNNER_PYTHON?.trim() || env.PYTHON_PATH?.trim() || (process.platform === "win32" ? "python" : "python3"),
    workerScript: env.RUNNER_WORKER_SCRIPT?.trim() || defaultWorkerScript(),
    cacheDir: env.RUNNER_CACHE_DIR?.trim() || join(homedir(), ".tbb-runner", "builds"),
    buildsKeep: Math.max(1, Number.parseInt(env.RUNNER_BUILDS_KEEP ?? "", 10) || 20),
  };
}
