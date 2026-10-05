/**
 * @fileoverview Флаг роли bot_runtime для подключений ботов к базе панели
 * @module server/utils/isBotRuntimeEnabled
 */

/**
 * Включена ли роль bot_runtime.
 * По умолчанию выключено: боты по-прежнему получают DATABASE_URL панели.
 * Включается значениями true, 1 или yes (как другие флаги сервера).
 * @param env - Окружение сервера
 * @returns true, если BOT_RUNTIME_ENABLED равен true/1/yes
 */
export function isBotRuntimeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.BOT_RUNTIME_ENABLED?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
