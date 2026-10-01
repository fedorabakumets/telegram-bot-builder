/**
 * @fileoverview Среда запуска Python-воркеров: обычный процесс или Docker-контейнер.
 * WORKER_RUNTIME=process (по умолчанию) — воркер запускается как дочерний процесс сервера;
 * WORKER_RUNTIME=docker — каждый воркер (проект/владелец/общий, см. WORKER_GROUPING)
 * запускается в отдельном контейнере без переменных окружения сервера;
 * WORKER_RUNTIME=remote — воркеры запускает исполнитель (`npm run runner`), связь через Redis Streams.
 * @module server/bots/workerRuntime
 */

/** Среда запуска воркеров */
export type WorkerRuntime = "process" | "docker" | "remote";

/** Настройки запуска воркеров в Docker */
export interface DockerWorkerConfig {
  /** Docker-образ с Python и зависимостями ботов */
  image: string;
  /** Python внутри образа */
  python: string;
  /** Сеть контейнера: host, bridge или сеть docker compose */
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
  const value = process.env.WORKER_RUNTIME?.trim().toLowerCase();
  return value === "docker" || value === "remote" ? value : "process";
}

/**
 * ID исполнителя, которому панель отдаёт воркеры в режиме remote
 * @returns WORKER_RUNNER_ID или "default"
 */
export function getWorkerRunnerId(): string {
  return process.env.WORKER_RUNNER_ID?.trim() || "default";
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
  const env = process.env;
  return {
    image: env.WORKER_DOCKER_IMAGE?.trim() || "ghcr.io/fedorabakumets/telegram-bot-builder:latest",
    python: env.WORKER_DOCKER_PYTHON?.trim() || "python3",
    network: env.WORKER_DOCKER_NETWORK?.trim() || "host",
    memory: env.WORKER_MEMORY_LIMIT?.trim() ?? "",
    cpus: env.WORKER_CPUS?.trim() ?? "",
    user: env.WORKER_DOCKER_USER?.trim() || currentUser(),
    hostRoot: env.WORKER_DOCKER_HOST_ROOT?.trim() ?? "",
    envPassthrough: parseEnvNameList(env.WORKER_ENV_PASSTHROUGH),
  };
}
