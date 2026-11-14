/** @fileoverview Передача безопасных настроек пула БД с приоритетом переменных бота. */

/** Настройки пула без адресов подключения и секретов панели. */
export const DATABASE_RUNTIME_ENV: readonly string[] = ["BOT_DB_POOL_IDLE_SECONDS"];

/**
 * Дополняет переменные бота настройками процесса, сохраняя явные значения.
 * @param variables - Собственные переменные бота.
 * @param env - Окружение сервера.
 * @returns Новый список переменных без наследования подключений.
 */
export function withDatabaseRuntimeEnv<T extends { key: string; value: string }>(
  variables: T[], env: NodeJS.ProcessEnv = process.env,
): Array<T | { key: string; value: string }> {
  const result: Array<T | { key: string; value: string }> = [...variables];
  for (const key of DATABASE_RUNTIME_ENV) {
    const value = env[key]?.trim();
    if (value && !result.some((entry) => entry.key === key)) result.push({ key, value });
  }
  return result;
}
