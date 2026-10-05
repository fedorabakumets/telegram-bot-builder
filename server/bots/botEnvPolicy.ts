/**
 * @fileoverview Политика передачи серверных переменных окружения ботам.
 * Переменная сервера уходит боту (наследованием воркера или ссылкой `${{VAR}}`), только если
 * администратор перечислил её в WORKER_ENV_PASSTHROUGH и её нет в жёстком denylist.
 * Denylist нельзя обойти через WORKER_ENV_PASSTHROUGH — так секреты панели
 * (SESSION_SECRET, ADMIN_API_KEY, пароли БД, токены Railway) не попадают к коду ботов.
 * @module server/bots/botEnvPolicy
 */

import { runtimeEnv } from "../services/runtime-overlay";
import { parseEnvNameList } from "./workerRuntime";

/** Имена, которые никогда не отдаются боту как серверная переменная */
export const SERVER_ENV_DENY_EXACT: readonly string[] = [
  "SESSION_SECRET",
  "ADMIN_API_KEY",
  "DATABASE_URL",
  "REDIS_URL",
  "TELEGRAM_BOT_TOKEN",
  "VITE_TELEGRAM_BOT_TOKEN",
  "MCP_AGENT_TOKEN",
];

/** Префиксы запрещённых имён: параметры PostgreSQL, Railway и исполнителя */
export const SERVER_ENV_DENY_PREFIXES: readonly string[] = ["PG", "RAILWAY_", "RUNNER_"];

/** Подстроки запрещённых имён: секреты, пароли, ключи и адреса подключений с паролями */
export const SERVER_ENV_DENY_SUBSTRINGS: readonly string[] = [
  "SECRET",
  "PASSWORD",
  "PASSWD",
  "PRIVATE_KEY",
  "DATABASE_URL",
  "REDIS_URL",
];

/**
 * Проверяет, входит ли имя серверной переменной в жёсткий denylist (без учёта регистра)
 * @param name - Имя переменной
 * @returns true, если переменную нельзя отдавать боту ни при каких настройках
 */
export function isServerEnvDenied(name: string): boolean {
  const upper = name.toUpperCase();
  return (
    SERVER_ENV_DENY_EXACT.includes(upper) ||
    SERVER_ENV_DENY_PREFIXES.some((prefix) => upper.startsWith(prefix)) ||
    SERVER_ENV_DENY_SUBSTRINGS.some((part) => upper.includes(part))
  );
}

/**
 * Список переменных сервера, разрешённых администратором для ботов
 * @param env - Окружение сервера
 * @returns имена из WORKER_ENV_PASSTHROUGH (без проверки denylist)
 */
export function getEnvPassthrough(env: NodeJS.ProcessEnv = process.env): string[] {
  return parseEnvNameList(runtimeEnv("WORKER_ENV_PASSTHROUGH", env));
}

/**
 * Проверяет, можно ли поделиться серверной переменной с ботом
 * @param name - Имя переменной
 * @param passthrough - Разрешённые администратором имена (WORKER_ENV_PASSTHROUGH)
 * @returns true, если имя разрешено и не в denylist
 */
export function canShareServerEnv(name: string, passthrough: readonly string[] = getEnvPassthrough()): boolean {
  return passthrough.includes(name) && !isServerEnvDenied(name);
}

/**
 * Имена серверных переменных, которые реально можно подставить боту через `${{VAR}}`
 * @param env - Окружение сервера
 * @returns разрешённые, не запрещённые и заданные (непустые) имена
 */
export function getShareableServerEnvKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  const passthrough = getEnvPassthrough(env);
  return [...new Set(passthrough)].filter((name) => canShareServerEnv(name, passthrough) && !!env[name]);
}
