/**
 * @fileoverview Литерал пароля роли bot_runtime для ALTER ROLE
 * @module server/database/bot-runtime/quote-role-password
 */

/**
 * Берёт пароль из строки подключения.
 * @param databaseUrl - BOT_DATABASE_URL
 * @returns Пароль пользователя в URL
 */
export function passwordFromDatabaseUrl(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  return decodeURIComponent(parsed.password);
}

/**
 * Экранирует пароль как строковый литерал SQL.
 * Пароль не хранится в файле политики: его подставляет вызов старта.
 * @param password - Пароль роли
 * @returns Литерал в одинарных кавычках
 */
export function quoteRolePassword(password: string): string {
  if (password.includes("\0")) {
    throw new Error("Пароль роли bot_runtime содержит NUL");
  }
  return `'${password.replace(/'/g, "''")}'`;
}
