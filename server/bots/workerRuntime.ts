/**
 * @fileoverview Среда запуска Python-воркеров: обычный процесс или Docker-контейнер.
 * WORKER_RUNTIME=process (по умолчанию) — воркер запускается как дочерний процесс сервера;
 * WORKER_RUNTIME=docker — каждый воркер (проект/владелец/общий, см. WORKER_GROUPING)
 * запускается в отдельном контейнере без переменных окружения сервера;
 * WORKER_RUNTIME=remote — воркеры запускает исполнитель (`npm run runner`), связь через Redis Streams.
 * @module server/bots/workerRuntime
 */

import { runtimeEnv } from "../services/runtime-overlay";
import { resolveWorkerDockerNetwork } from "./workerDockerFlags";

/** Среда запуска воркеров */
export type WorkerRuntime = "process" | "docker" | "remote";

/** Настройки запуска воркеров в Docker */
export interface DockerWorkerConfig {
  /** Docker-образ с Python и зависимостями ботов */
  image: string;
  /** Python внутри образа */
  python: string;
  /** Сеть контейнера: host либо имя из WORKER_DOCKER_NETWORK / WORKER_DOCKER_BRIDGE_NAME */
  network: string;
  /** Лимит памяти контейнера (формат docker: 256m, 1g), пусто — без лимита */
  memory: string;
  /** Лимит CPU контейнера (например 0.5), пусто — без лимита */
  cpus: string;
  /** Пользователь в контейнере uid:gid, пусто — пользователь образа */
  user: string;
  /** Путь к корню приложения на хосте Docker, если сервер сам работает в контейнере */
  hostRoot: string;
  /** Переменные сервера, которые разрешено передавать ботам */
  envPassthrough: string[];
}

/**
 * Возвращает среду запуска воркеров из WORKER_RUNTIME
 * @returns docker, remote или process
 */
export function getWorkerRuntime(): WorkerRuntime {
  const value = runtimeEnv("WORKER_RUNTIME")?.toLowerCase();
  return value === "docker" || value === "remote" ? value : "process";
}

/**
 * ID исполнителя, которому панель отдаёт воркеры в режиме remote
 * @returns WORKER_RUNNER_ID или "default"
 */
export function getWorkerRunnerId(): string {
  return runtimeEnv("WORKER_RUNNER_ID") || "default";
}

/** Откуда исполнитель берёт код бота: сборка из S3 или путь к папке bots/ панели */
export type WorkerRunnerCodeSource = "build" | "path";

/**
 * Источник кода для исполнителя из WORKER_RUNNER_CODE
 * @returns "path" только при явном значении (исполнитель на той же машине), иначе "build"
 */
export function getWorkerRunnerCodeSource(): WorkerRunnerCodeSource {
  return process.env.WORKER_RUNNER_CODE?.trim().toLowerCase() === "path" ? "path" : "build";
}

/**
 * Проверяет, запускаются ли воркеры в Docker
 * @returns true при WORKER_RUNTIME=docker
 */
export function isDockerWorkerRuntime(): boolean {
  return getWorkerRuntime() === "docker";
}

/**
 * Разбирает список имён переменных через запятую
 * @param value - Строка вида "A, B,C"
 * @returns имена без пустых элементов
 */
export function parseEnvNameList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
}

/**
 * Возвращает uid:gid текущего процесса для файлов, которые бот пишет в uploads
 * @returns строка uid:gid или пусто на Windows
 */
function currentUser(): string {
  if (typeof process.getuid !== "function" || typeof process.getgid !== "function") return "";
  return `${process.getuid()}:${process.getgid()}`;
}

/**
 * Читает настройки Docker-воркеров из переменных окружения
 * @returns настройки с значениями по умолчанию
 */
export function getDockerWorkerConfig(): DockerWorkerConfig {
  return {
    image: runtimeEnv("WORKER_DOCKER_IMAGE") || "ghcr.io/fedorabakumets/telegram-bot-builder:latest",
    python: process.env.WORKER_DOCKER_PYTHON?.trim() || "python3",
    network: resolveWorkerDockerNetwork(process.env),
    memory: runtimeEnv("WORKER_MEMORY_LIMIT") ?? "",
    cpus: runtimeEnv("WORKER_CPUS") ?? "",
    user: process.env.WORKER_DOCKER_USER?.trim() || currentUser(),
    hostRoot: runtimeEnv("WORKER_DOCKER_HOST_ROOT") ?? "",
    envPassthrough: parseEnvNameList(runtimeEnv("WORKER_ENV_PASSTHROUGH")),
  };
}
