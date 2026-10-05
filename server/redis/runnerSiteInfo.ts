/**
 * @fileoverview Сведения исполнителя о своей площадке в Redis: какая у ботов база и Redis,
 * где он запущен. Исполнитель записывает их при старте, панели достаточно адреса Redis
 * площадки, чтобы найти исполнителей и их базу.
 * @module server/redis/runnerSiteInfo
 */

import type { Redis as RedisConnection } from "ioredis";
import { runnerSiteConnectionUrls } from "./runnerSiteInfoUrls";

/** Множество ID исполнителей, подключённых к этому Redis */
export const RUNNER_REGISTRY_KEY = "tbb:runners";

/** Версия формата сведений: растёт при несовместимых изменениях */
export const RUNNER_SITE_INFO_VERSION = 1;

/** Сведения исполнителя о площадке */
export interface RunnerSiteInfo {
  /** Версия формата сведений */
  v: number;
  /** ID исполнителя (поток команд `tbb:runner:<id>:cmd`) */
  runnerId: string;
  /** Где запущен: "railway" или "docker" */
  platform: string;
  /** Регион Railway, если известен */
  region?: string;
  /** Адрес PostgreSQL для ботов внутри площадки */
  botDatabaseUrl?: string;
  /** Адрес PostgreSQL площадки снаружи (для панели и бэкапов) */
  databasePublicUrl?: string;
  /** Адрес Redis для ботов внутри площадки */
  botRedisUrl?: string;
  /** Время запуска исполнителя (ISO) */
  startedAt: string;
}

/**
 * Ключ сведений исполнителя
 * @param runnerId - ID исполнителя
 * @returns ключ Redis
 */
export function runnerInfoKey(runnerId: string): string {
  return `tbb:runner:${runnerId}:info`;
}

/**
 * Значение переменной окружения без пробелов или undefined
 * @param value - Сырое значение
 * @returns непустая строка или undefined
 */
function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

/**
 * Собирает сведения о площадке из окружения исполнителя.
 * RUNNER_SITE_INFO_HIDE_URLS выключен — адреса пишутся целиком, версия формата не растёт.
 * @param runnerId - ID исполнителя
 * @param env - Переменные окружения
 * @returns сведения для записи в Redis
 */
export function readRunnerSiteInfo(runnerId: string, env: NodeJS.ProcessEnv = process.env): RunnerSiteInfo {
  return {
    v: RUNNER_SITE_INFO_VERSION,
    runnerId,
    // RAILWAY_PROJECT_ID бывает и в .env панели, а RAILWAY_REPLICA_ID Railway задаёт только контейнеру
    platform: env.RAILWAY_REPLICA_ID ? "railway" : "docker",
    region: nonEmpty(env.RAILWAY_REPLICA_REGION),
    ...runnerSiteConnectionUrls(env),
    startedAt: new Date().toISOString(),
  };
}

/**
 * Записывает сведения исполнителя и регистрирует его в списке исполнителей
 * @param redis - Соединение с Redis площадки
 * @param info - Сведения о площадке
 */
export async function publishRunnerSiteInfo(redis: RedisConnection, info: RunnerSiteInfo): Promise<void> {
  await redis.multi().set(runnerInfoKey(info.runnerId), JSON.stringify(info)).sadd(RUNNER_REGISTRY_KEY, info.runnerId).exec();
}

/**
 * Читает сведения всех исполнителей, подключённых к Redis площадки
 * @param redis - Соединение с Redis площадки
 * @returns сведения исполнителей (повреждённые записи пропускаются)
 */
export async function listRunnerSiteInfos(redis: RedisConnection): Promise<RunnerSiteInfo[]> {
  const ids = (await redis.smembers(RUNNER_REGISTRY_KEY)).sort();
  if (ids.length === 0) return [];
  const raw = await redis.mget(ids.map(runnerInfoKey));
  return raw.flatMap((value) => {
    if (!value) return [];
    try {
      return [JSON.parse(value) as RunnerSiteInfo];
    } catch {
      return [];
    }
  });
}
