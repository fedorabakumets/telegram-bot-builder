/**
 * @fileoverview Флаг RUNNER_SITE_INFO_HIDE_URLS и поля адресов в сведениях исполнителя.
 * По умолчанию флаг выключен: адреса пишутся целиком.
 * @module server/redis/runnerSiteInfoUrls
 */

import { runtimeFlag } from "../services/runtime-overlay";

/** Адреса базы и Redis площадки в сведениях исполнителя */
export interface RunnerSiteConnectionUrls {
  /** Адрес PostgreSQL для ботов внутри площадки */
  botDatabaseUrl?: string;
  /** Адрес PostgreSQL площадки снаружи */
  databasePublicUrl?: string;
  /** Адрес Redis для ботов внутри площадки */
  botRedisUrl?: string;
}

/**
 * Скрывать ли полные адреса базы и Redis в сведениях исполнителя.
 * @param env - Окружение исполнителя
 * @returns true, если RUNNER_SITE_INFO_HIDE_URLS равен true/1/yes
 */
export function isRunnerSiteInfoHideUrls(env: NodeJS.ProcessEnv): boolean {
  return runtimeFlag("RUNNER_SITE_INFO_HIDE_URLS", env);
}

/**
 * Непустая строка переменной окружения
 * @param value - Сырое значение
 * @returns строка без крайних пробелов или undefined
 */
function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

/**
 * Поля адресов для записи в Redis.
 * Флаг выключен — три поля целиком. Флаг включён — полей нет.
 * @param env - Окружение исполнителя
 * @returns поля адресов или пустой объект
 */
export function runnerSiteConnectionUrls(env: NodeJS.ProcessEnv): RunnerSiteConnectionUrls {
  if (isRunnerSiteInfoHideUrls(env)) return {};
  return {
    botDatabaseUrl: nonEmpty(env.RUNNER_BOT_DATABASE_URL),
    databasePublicUrl: nonEmpty(env.RUNNER_DATABASE_PUBLIC_URL),
    botRedisUrl: nonEmpty(env.RUNNER_BOT_REDIS_URL),
  };
}
