/**
 * @fileoverview Подготовка запуска воркера: команда, окружение, монтируемые проекты
 * и копирование папки бота в каталог контейнера (WORKER_RUNTIME=docker).
 * @module server/bots/workerLaunch
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { getDockerWorkerConfig, isDockerWorkerRuntime } from "./workerRuntime";
import { getProjectPlacement } from "./botPlacement";
import { buildDockerWorkerCommand, CONTAINER_APP_ROOT, dockerWorkerName } from "./workerDockerArgs";
import { resolveWorkerProjects } from "./resolveWorkerProjects";
import { retargetBotCodeCache } from "./retargetBotCodeCache";
import { buildWorkerBaseEnv } from "./workerBaseEnv";

/** Как запустить процесс воркера */
export interface WorkerLaunch {
  /** Исполняемый файл: python или docker */
  command: string;
  /** Аргументы */
  args: string[];
  /** Окружение процесса */
  env: NodeJS.ProcessEnv;
  /** Проекты, доступные воркеру; null — все */
  projects: Set<number> | null;
  /** true, если воркер работает в контейнере */
  docker: boolean;
  /** ID исполнителя для WORKER_RUNTIME=remote; null — воркер запускается на этой машине */
  runnerId: string | null;
  /** ID проекта, если исполнитель — его сервис на Railway (поднимается перед запуском) */
  railwayProjectId?: number | null;
}

/**
 * Каталог копий папок ботов для контейнера воркера
 * @param workerKey - Ключ воркера
 * @returns абсолютный путь
 */
function stagedBotsDir(workerKey: number): string {
  return join(process.cwd(), ".worker-runtime", dockerWorkerName(workerKey), "bots");
}

/**
 * Удаляет оставшийся после падения сервера контейнер с тем же именем
 * @param name - Имя контейнера
 */
function removeStaleContainer(name: string): void {
  try {
    execFileSync("docker", ["rm", "-f", name], { stdio: "ignore", timeout: 15_000 });
  } catch {
    // Контейнера нет — штатная ситуация
  }
}

/**
 * Готовит запуск воркера в выбранной среде
 * @param workerKey - Ключ воркера
 * @param projectId - Проект запускаемого бота
 * @param pythonPath - Python сервера (режим process)
 * @param workerScript - Путь к worker.py
 * @param memberProjectIds - Проекты ботов, которые уже будут в этом воркере
 * @returns команда, окружение и доступные проекты
 */
export async function prepareWorkerLaunch(
  workerKey: number,
  projectId: number,
  pythonPath: string,
  workerScript: string,
  memberProjectIds: readonly number[] = [],
): Promise<WorkerLaunch> {
  const placement = getProjectPlacement(projectId);
  if (placement.runnerId) {
    // Команду и окружение воркера определяет исполнитель
    return { command: "", args: [], env: {}, projects: null, docker: false, ...placement };
  }
  if (!isDockerWorkerRuntime()) {
    const env = { ...buildWorkerBaseEnv(), PROJECT_ID: workerKey.toString() };
    return { command: pythonPath, args: ["-u", workerScript], env, projects: null, docker: false, runnerId: null };
  }
  // Ошибка имени сети при изоляции — до каталогов и до сборки аргументов docker run
  const config = getDockerWorkerConfig();
  const projectIds = await resolveWorkerProjects(workerKey, projectId, memberProjectIds);
  const appRoot = process.cwd();
  const staged = stagedBotsDir(workerKey);
  // Копии от прошлого контейнера могут принадлежать проектам, которые сменили владельца
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  for (const id of projectIds ?? []) mkdirSync(join(appRoot, "uploads", String(id)), { recursive: true });

  const cmd = buildDockerWorkerCommand(workerKey, projectIds, config, {
    appRoot,
    pythonDir: dirname(workerScript),
    stagedBotsDir: staged,
  });
  removeStaleContainer(cmd.name);
  const clientEnv: NodeJS.ProcessEnv = {};
  for (const key of ["PATH", "DOCKER_HOST", "DOCKER_CONFIG", "DOCKER_CONTEXT", "DOCKER_CERT_PATH", "DOCKER_TLS_VERIFY"]) {
    if (process.env[key]) clientEnv[key] = process.env[key];
  }
  return {
    command: "docker",
    args: cmd.args,
    env: { ...clientEnv, ...cmd.env },
    projects: projectIds ? new Set(projectIds) : null,
    docker: true,
    runnerId: null,
  };
}

/**
 * Удаляет копию папки остановленного бота из каталога контейнера
 * @param workerKey - Ключ воркера
 * @param botFile - Путь к основному .py бота на сервере
 */
export function unstageBotFile(workerKey: number, botFile: string): void {
  rmSync(join(stagedBotsDir(workerKey), basename(dirname(botFile))), { recursive: true, force: true });
}

/**
 * Копирует папку бота в каталог контейнера и возвращает путь внутри контейнера.
 * Для воркера-процесса возвращает исходный путь без копирования.
 * @param workerKey - Ключ воркера
 * @param botFile - Путь к основному .py бота на сервере
 * @param docker - true, если воркер работает в контейнере
 * @returns путь к .py, который нужно передать воркеру
 */
export function stageBotFile(workerKey: number, botFile: string, docker: boolean): string {
  if (!docker) return botFile;
  const folder = basename(dirname(botFile));
  const target = join(stagedBotsDir(workerKey), folder);
  rmSync(target, { recursive: true, force: true });
  cpSync(dirname(botFile), target, { recursive: true });
  retargetBotCodeCache(botFile, join(target, basename(botFile)));
  return `${CONTAINER_APP_ROOT}/bots/${folder}/${basename(botFile)}`;
}
