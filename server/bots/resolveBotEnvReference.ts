/**
 * @fileoverview Подстановка ссылок `${{VAR}}` в переменных окружения бота.
 * В режимах WORKER_RUNTIME=docker и remote, а также при заданном WORKER_RAILWAY_PROJECTS
 * ссылка раскрывается только для переменных из WORKER_ENV_PASSTHROUGH, иначе бот мог бы
 * получить секреты сервера (`${{SESSION_SECRET}}`).
 * @module server/bots/resolveBotEnvReference
 */

import { getDockerWorkerConfig, getWorkerRuntime } from "./workerRuntime";

/**
 * Раскрывает значение вида `${{VAR}}` из окружения сервера
 * @param value - Значение переменной бота
 * @param env - Окружение сервера
 * @returns значение переменной сервера или исходная строка, если ссылка не раскрывается
 */
export function resolveBotEnvReference(value: string, env: NodeJS.ProcessEnv = process.env): string {
  if (!value.startsWith("${{") || !value.endsWith("}}")) return value;
  const name = value.slice(3, -2).trim();
  const isolated = getWorkerRuntime() !== "process" || process.env.WORKER_RAILWAY_PROJECTS?.trim();
  if (isolated && !getDockerWorkerConfig().envPassthrough.includes(name)) {
    console.warn(`[BotEnv] ссылка \${{${name}}} не раскрыта: переменной нет в WORKER_ENV_PASSTHROUGH`);
    return value;
  }
  return env[name] ?? value;
}
