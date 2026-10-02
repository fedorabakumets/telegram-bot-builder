/**
 * @fileoverview Подстановка ссылок `${{VAR}}` в переменных окружения бота.
 * Во всех режимах WORKER_RUNTIME ссылка раскрывается только для переменных из
 * WORKER_ENV_PASSTHROUGH, не попавших в denylist (см. botEnvPolicy), иначе бот мог бы
 * получить секреты сервера (`${{SESSION_SECRET}}`). Нераскрытая ссылка остаётся текстом.
 * @module server/bots/resolveBotEnvReference
 */

import { canShareServerEnv, getEnvPassthrough, isServerEnvDenied } from "./botEnvPolicy";

/** Переменные, которые бот получает от панели сам, если у токена не задано своё значение */
const PLATFORM_CONNECTION_KEYS = ["DATABASE_URL", "REDIS_URL"];

/**
 * Проверяет, что значение целиком является ссылкой `${{VAR}}`
 * @param value - Значение переменной бота
 * @returns true для ссылки
 */
export function isBotEnvReference(value: string): boolean {
  return value.startsWith("${{") && value.endsWith("}}");
}

/**
 * Раскрывает значение вида `${{VAR}}` из окружения сервера
 * @param value - Значение переменной бота
 * @param env - Окружение сервера
 * @returns значение переменной сервера или исходная строка, если ссылка не раскрывается
 */
export function resolveBotEnvReference(value: string, env: NodeJS.ProcessEnv = process.env): string {
  if (!isBotEnvReference(value)) return value;
  const name = value.slice(3, -2).trim();
  if (!canShareServerEnv(name, getEnvPassthrough())) {
    const reason = isServerEnvDenied(name) ? "переменная сервера запрещена для ботов" : "переменной нет в WORKER_ENV_PASSTHROUGH";
    console.warn(`[BotEnv] ссылка \${{${name}}} не раскрыта: ${reason}`);
    return value;
  }
  return env[name] ?? value;
}

/**
 * Раскрывает ссылки в переменных бота. Нераскрытые ссылки в DATABASE_URL/REDIS_URL
 * отбрасываются, чтобы бот получил подключение панели, а не текст `${{…}}`.
 * @param variables - Переменные бота из БД
 * @param env - Окружение сервера
 * @returns переменные с раскрытыми значениями
 */
export function resolveBotEnvVariables(
  variables: Array<{ key: string; value: string }>,
  env: NodeJS.ProcessEnv = process.env,
): Array<{ key: string; value: string }> {
  return variables
    .map((v) => ({ key: v.key, value: resolveBotEnvReference(v.value, env) }))
    .filter((v) => !(PLATFORM_CONNECTION_KEYS.includes(v.key) && isBotEnvReference(v.value)));
}
