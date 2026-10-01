/**
 * @fileoverview Настройки запуска ботов на Railway: какие проекты туда идут,
 * куда создавать сервисы исполнителей и с какими переменными.
 * Каждый такой проект получает свой сервис Railway с исполнителем внутри.
 * @module server/bots/railway/railwayConfig
 */

/** Настройки Railway для сервисов исполнителей */
export interface RailwayConfig {
  /** Токен API (workspace, аккаунта или проекта) */
  apiToken: string;
  /** true — токен проекта (заголовок Project-Access-Token), иначе Bearer */
  projectToken: boolean;
  /** ID проекта Railway, где создаются сервисы */
  projectId: string;
  /** ID окружения Railway */
  environmentId: string;
  /** Образ исполнителя */
  image: string;
  /** REDIS_URL для исполнителя внутри Railway (обычно внутренний адрес Redis проекта) */
  runnerRedisUrl: string;
  /** Регион сервисов, например europe-west4-drams3a (Амстердам); пусто — регион Railway по умолчанию */
  region: string;
}

/**
 * Разбирает список ID проектов через запятую
 * @param value - Строка вида "1, 5"
 * @returns множество ID
 */
function parseProjectIds(value: string | undefined): Set<number> {
  const ids = (value ?? "").split(",").map((part) => Number.parseInt(part.trim(), 10));
  return new Set(ids.filter((id) => Number.isInteger(id) && id > 0));
}

/**
 * Проверяет, запускаются ли боты проекта на Railway (WORKER_RAILWAY_PROJECTS)
 * @param projectId - ID проекта
 * @returns true, если проект в списке
 */
export function isRailwayProject(projectId: number): boolean {
  return parseProjectIds(process.env.WORKER_RAILWAY_PROJECTS).has(projectId);
}

/**
 * ID исполнителя проекта на Railway
 * @param projectId - ID проекта
 * @returns ID для потоков Redis
 */
export function railwayRunnerId(projectId: number): string {
  return `railway-p${projectId}`;
}

/**
 * Имя сервиса Railway с исполнителем проекта
 * @param projectId - ID проекта
 * @returns имя сервиса
 */
export function railwayServiceName(projectId: number): string {
  return `tbb-bot-p${projectId}`;
}

/**
 * Адреса БД и Redis для ботов на Railway (вместо адресов панели, недоступных оттуда)
 * @param env - Переменные окружения
 * @returns заданные RAILWAY_BOT_DATABASE_URL и RAILWAY_BOT_REDIS_URL
 */
export function railwayBotEnvDefaults(env: NodeJS.ProcessEnv = process.env): Partial<Record<"DATABASE_URL" | "REDIS_URL", string>> {
  const defaults: Partial<Record<"DATABASE_URL" | "REDIS_URL", string>> = {};
  if (env.RAILWAY_BOT_DATABASE_URL?.trim()) defaults.DATABASE_URL = env.RAILWAY_BOT_DATABASE_URL.trim();
  if (env.RAILWAY_BOT_REDIS_URL?.trim()) defaults.REDIS_URL = env.RAILWAY_BOT_REDIS_URL.trim();
  return defaults;
}

/**
 * Читает настройки Railway из окружения
 * @param env - Переменные окружения
 * @returns настройки
 * @throws Error, если не хватает обязательных переменных
 */
export function getRailwayConfig(env: NodeJS.ProcessEnv = process.env): RailwayConfig {
  const projectToken = env.RAILWAY_TOKEN?.trim() ?? "";
  const apiToken = env.RAILWAY_API_TOKEN?.trim() || projectToken;
  const config: RailwayConfig = {
    apiToken,
    projectToken: !env.RAILWAY_API_TOKEN?.trim() && projectToken !== "",
    projectId: env.RAILWAY_PROJECT_ID?.trim() ?? "",
    environmentId: env.RAILWAY_ENVIRONMENT_ID?.trim() ?? "",
    image: env.RAILWAY_RUNNER_IMAGE?.trim() || "ghcr.io/fedorabakumets/telegram-bot-builder-runner:latest",
    runnerRedisUrl: env.RAILWAY_RUNNER_REDIS_URL?.trim() || "${{Redis.REDIS_URL}}",
    region: env.RAILWAY_REGION?.trim() ?? "",
  };
  const missing = [
    !config.apiToken && "RAILWAY_API_TOKEN или RAILWAY_TOKEN",
    !config.projectId && "RAILWAY_PROJECT_ID",
    !config.environmentId && "RAILWAY_ENVIRONMENT_ID",
  ].filter(Boolean);
  if (missing.length > 0) throw new Error(`Для запуска на Railway задайте ${missing.join(", ")}`);
  return config;
}
