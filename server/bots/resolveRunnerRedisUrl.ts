/**
 * @fileoverview Адрес Redis для связи панели с исполнителями.
 * Флаг WORKER_RUNNER_REDIS_REQUIRED по умолчанию выключен.
 * @module server/bots/resolveRunnerRedisUrl
 */

/**
 * Включён ли запрет запасного REDIS_URL панели.
 * @param env - Окружение панели
 * @returns true, если WORKER_RUNNER_REDIS_REQUIRED равен true/1/yes
 */
export function isWorkerRunnerRedisRequired(env: NodeJS.ProcessEnv): boolean {
  const value = env.WORKER_RUNNER_REDIS_REQUIRED?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

/**
 * Адрес Redis исполнителей.
 * Флаг выключен: WORKER_RUNNER_REDIS_URL, иначе REDIS_URL панели.
 * Флаг включён: только WORKER_RUNNER_REDIS_URL, без падения на REDIS_URL.
 * @param env - Окружение панели
 * @returns адрес Redis
 * @throws Error, если нужный адрес пуст
 */
export function resolveRunnerRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  const dedicated = env.WORKER_RUNNER_REDIS_URL?.trim();
  if (isWorkerRunnerRedisRequired(env)) {
    if (!dedicated) {
      throw new Error(
        "Задайте WORKER_RUNNER_REDIS_URL: WORKER_RUNNER_REDIS_REQUIRED запрещает запасной REDIS_URL панели",
      );
    }
    return dedicated;
  }
  const url = dedicated || env.REDIS_URL?.trim();
  if (!url) throw new Error("Для исполнителей нужен WORKER_RUNNER_REDIS_URL или REDIS_URL");
  return url;
}
