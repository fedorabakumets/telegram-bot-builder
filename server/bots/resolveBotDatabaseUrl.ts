/**
 * @fileoverview Какой DATABASE_URL класть в словарь бота
 * @module server/bots/resolveBotDatabaseUrl
 */

import { runtimeEnv } from "../services/runtime-overlay";
import { isBotRuntimeEnabled } from "../utils/isBotRuntimeEnabled";

/** Решение, какую строку подключения видит бот */
export interface BotDatabaseUrlDecision {
  /** Строка для ключа DATABASE_URL в словаре бота; панель свою строку не меняет */
  databaseUrl: string | undefined;
  /** true — подставлять BOT_DATABASE_URL и генерировать код под роль */
  useBotRuntime: boolean;
  /** Текст предупреждения, если флаг включён без адреса */
  warning: string | null;
}

/** Предупреждение уже написано в этом процессе */
let warned = false;

/**
 * Решает, подставлять ли боту BOT_DATABASE_URL вместо DATABASE_URL панели.
 * Флаг выключен — всегда адрес панели.
 * Флаг включён, а BOT_DATABASE_URL пуст — адрес панели и предупреждение, без падения.
 * @param env - Окружение сервера
 * @returns Решение для словаря бота и генерации кода
 */
export function resolveBotDatabaseUrl(env: NodeJS.ProcessEnv = process.env): BotDatabaseUrlDecision {
  const panelUrl = env.DATABASE_URL?.trim() || undefined;
  if (!isBotRuntimeEnabled(env)) {
    return { databaseUrl: panelUrl, useBotRuntime: false, warning: null };
  }
  const botUrl = runtimeEnv("BOT_DATABASE_URL", env);
  if (!botUrl) {
    return {
      databaseUrl: panelUrl,
      useBotRuntime: false,
      warning:
        "BOT_RUNTIME_ENABLED включён, но BOT_DATABASE_URL пуст. Боты остаются на DATABASE_URL панели, роль bot_runtime не создаётся.",
    };
  }
  return { databaseUrl: botUrl, useBotRuntime: true, warning: null };
}

/**
 * Активна ли роль для генерации кода и словаря бота: флаг включён и адрес задан.
 * @param env - Окружение сервера
 * @returns true, если боту нужно подставлять BOT_DATABASE_URL
 */
export function isBotRuntimeActive(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveBotDatabaseUrl(env).useBotRuntime;
}

/**
 * Пишет предупреждение о пустом BOT_DATABASE_URL один раз за процесс.
 * @param env - Окружение сервера
 */
export function warnBotRuntimeIfNeeded(env: NodeJS.ProcessEnv = process.env): void {
  const { warning } = resolveBotDatabaseUrl(env);
  if (!warning || warned) return;
  warned = true;
  console.warn(`⚠️ ${warning}`);
}
