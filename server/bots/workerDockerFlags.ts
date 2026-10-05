/**
 * @fileoverview Флаги изоляции Docker-воркера и имя сети контейнера.
 * Пока WORKER_DOCKER_ISOLATE выключен, сеть остаётся host
 * (или WORKER_DOCKER_NETWORK) — как до появления флага.
 * @module server/bots/workerDockerFlags
 */

import { runtimeEnv, runtimeFlag } from "../services/runtime-overlay";

/**
 * Проверяет булев флаг окружения (true, 1, yes, без учёта регистра)
 * @param env - Окружение
 * @param name - Имя переменной
 * @returns true, если значение одно из true/1/yes
 */
export function isEnvFlag(env: NodeJS.ProcessEnv, name: string): boolean {
  return runtimeFlag(name, env);
}

/**
 * Включена ли изоляция сети и каталогов uploads
 * @param env - Окружение, по умолчанию process.env
 * @returns true при WORKER_DOCKER_ISOLATE=true/1/yes
 */
export function isWorkerDockerIsolate(env: NodeJS.ProcessEnv = process.env): boolean {
  return isEnvFlag(env, "WORKER_DOCKER_ISOLATE");
}

/**
 * Монтировать uploads только для чтения
 * @param env - Окружение, по умолчанию process.env
 * @returns true при WORKER_DOCKER_UPLOADS_READONLY=true/1/yes
 */
export function isWorkerUploadsReadonly(env: NodeJS.ProcessEnv = process.env): boolean {
  return isEnvFlag(env, "WORKER_DOCKER_UPLOADS_READONLY");
}

/**
 * Имя сети контейнера воркера.
 * Без изоляции — WORKER_DOCKER_NETWORK или host.
 * С изоляцией имя площадки обязательно: сначала WORKER_DOCKER_NETWORK,
 * иначе WORKER_DOCKER_BRIDGE_NAME. Пустое имя — ошибка до сборки docker run.
 * @param env - Окружение процесса
 * @returns значение для --network
 */
export function resolveWorkerDockerNetwork(env: NodeJS.ProcessEnv = process.env): string {
  const named = runtimeEnv("WORKER_DOCKER_NETWORK", env) || "";
  if (!isWorkerDockerIsolate(env)) return named || "host";
  const network = named || runtimeEnv("WORKER_DOCKER_BRIDGE_NAME", env) || "";
  if (network) return network;
  throw new Error(
    "WORKER_DOCKER_ISOLATE включён: задайте имя сети площадки в WORKER_DOCKER_NETWORK или WORKER_DOCKER_BRIDGE_NAME",
  );
}
