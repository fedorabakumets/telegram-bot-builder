/**
 * @fileoverview Настройки исполнителя ботов (`npm run runner`): к какому Redis подключаться,
 * под каким ID принимать команды панели и чем запускать worker.py.
 * @module server/runner/runnerConfig
 */

import { homedir } from "node:os";
import { join } from "node:path";

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
  /** Требовать версию намерения из БД для каждой команды бота */
  requireFence?: boolean;
  /** Приём polling process-ботов: прежний Python либо экспериментальный Node. */
  processPolling?: "python" | "node";
  /** Обработка очереди Node: отдельный процесс бота либо общий Python-процесс группы. */
  processHandler?: "isolated" | "shared";
  /** Раздельные Python-процессы либо общий хост постоянных и временных сценариев. */
  pythonHost?: "split" | "unified";
}

/**
 * Путь к worker.py при запуске из корня репозитория.
 * @returns путь к `server/python/worker.py`
 */
function defaultWorkerScript(): string {
  return join(process.cwd(), "server", "python", "worker.py");
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
  const processPolling = env.RUNNER_PROCESS_POLLING?.trim() || "python";
  if (processPolling !== "python" && processPolling !== "node")
    throw new Error("RUNNER_PROCESS_POLLING должен быть python или node");
  const processHandler = env.RUNNER_PROCESS_HANDLER?.trim() || "shared";
  if (processHandler !== "isolated" && processHandler !== "shared")
    throw new Error("RUNNER_PROCESS_HANDLER должен быть isolated или shared");
  const pythonHost = env.RUNNER_PYTHON_HOST?.trim() || "split";
  if (pythonHost !== "split" && pythonHost !== "unified")
    throw new Error("RUNNER_PYTHON_HOST должен быть split или unified");
  if (pythonHost === "unified" && (processPolling !== "node" || processHandler !== "shared"))
    throw new Error("RUNNER_PYTHON_HOST=unified требует RUNNER_PROCESS_POLLING=node и RUNNER_PROCESS_HANDLER=shared");
  return {
    processPolling,
    processHandler,
    pythonHost,
    runnerId: env.RUNNER_ID?.trim() || "default",
    redisUrl,
    pythonPath: env.RUNNER_PYTHON?.trim() || env.PYTHON_PATH?.trim() || (process.platform === "win32" ? "python" : "python3"),
    workerScript: env.RUNNER_WORKER_SCRIPT?.trim() || defaultWorkerScript(),
    cacheDir: env.RUNNER_CACHE_DIR?.trim() || join(homedir(), ".tbb-runner", "builds"),
    buildsKeep: Math.max(1, Number.parseInt(env.RUNNER_BUILDS_KEEP ?? "", 10) || 20),
    requireFence: env.RUNNER_REQUIRE_FENCE === "true",
  };
}
