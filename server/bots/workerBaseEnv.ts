/**
 * @fileoverview Базовое окружение Python-воркера/процесса бота вместо `...process.env`.
 * Из окружения сервера берутся только технические переменные (PATH, локаль, PYTHON*, сертификаты),
 * настройки самого воркера, системные адреса (API_BASE_URL, DATABASE_URL, REDIS_URL)
 * и переменные из WORKER_ENV_PASSTHROUGH, не попавшие в denylist (см. botEnvPolicy).
 * Значения бота (BOT_TOKEN, TOKEN_ID, свои переменные) воркер получает в команде start_bot или .env.
 * @module server/bots/workerBaseEnv
 */

import { canShareServerEnv, getEnvPassthrough, isServerEnvDenied } from "./botEnvPolicy";

/** Технические переменные ОС и Python (имена сравниваются в верхнем регистре) */
export const WORKER_TECH_ENV: readonly string[] = [
  "PATH", "HOME", "USER", "LOGNAME", "LANG", "LANGUAGE", "TZ", "TMPDIR", "TMP", "TEMP",
  "SSL_CERT_FILE", "SSL_CERT_DIR", "REQUESTS_CA_BUNDLE", "LD_LIBRARY_PATH", "VIRTUAL_ENV",
  "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "USERPROFILE", "APPDATA", "LOCALAPPDATA",
];

/** Префиксы технических переменных: локаль и настройки интерпретатора */
export const WORKER_TECH_ENV_PREFIXES: readonly string[] = ["LC_", "PYTHON"];

/** Переменные, которые читают worker.py и сгенерированный код бота */
export const WORKER_TUNING_ENV: readonly string[] = [
  "BOT_CODE_CACHE", "AIOGRAM_LAZY_MODELS", "WORKER_REPORT_MEMORY",
  "MAX_UPDATE_AGE_SECONDS", "DISABLE_ASYNC_LOG", "LOG_LEVEL",
];

/** Системные адреса панели, которые бот получает и так (слой 2) */
export const WORKER_SYSTEM_ENV: readonly string[] = ["API_BASE_URL", "WEBHOOK_BASE_URL"];

/** Подключения к БД и Redis панели: боты пока хранят в них свои данные */
export const WORKER_CONNECTION_ENV: readonly string[] = ["DATABASE_URL", "REDIS_URL"];

/** Настройки сборки базового окружения */
export interface WorkerBaseEnvOptions {
  /** Передавать DATABASE_URL и REDIS_URL сервера; false — для исполнителя: его REDIS_URL — канал к панели, а подключения бот получает в start_bot */
  includeConnections?: boolean;
  /** Разрешённые серверные переменные; по умолчанию WORKER_ENV_PASSTHROUGH из env */
  passthrough?: readonly string[];
}

/**
 * Проверяет, техническая ли это переменная
 * @param upper - Имя в верхнем регистре
 * @returns true для PATH, LC_*, PYTHON* и т.п. (кроме имён из denylist)
 */
function isTechEnv(upper: string): boolean {
  const tech = WORKER_TECH_ENV.includes(upper) || WORKER_TECH_ENV_PREFIXES.some((p) => upper.startsWith(p));
  return tech && !isServerEnvDenied(upper);
}

/**
 * Собирает окружение воркера из окружения сервера без секретов панели
 * @param env - Окружение сервера
 * @param options - Передавать ли подключения и какой список passthrough использовать
 * @returns новое окружение (исходный объект не меняется)
 */
export function buildWorkerBaseEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: WorkerBaseEnvOptions = {},
): NodeJS.ProcessEnv {
  const passthrough = options.passthrough ?? getEnvPassthrough(env);
  const exact = new Set([
    ...WORKER_TUNING_ENV,
    ...WORKER_SYSTEM_ENV,
    ...(options.includeConnections === false ? [] : WORKER_CONNECTION_ENV),
  ]);
  const result: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    if (exact.has(key) || isTechEnv(key.toUpperCase()) || canShareServerEnv(key, passthrough)) {
      result[key] = value;
    }
  }
  return result;
}
