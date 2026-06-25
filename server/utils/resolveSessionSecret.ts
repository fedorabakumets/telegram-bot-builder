/**
 * @fileoverview Безопасное получение секрета для подписи сессионных cookie.
 *
 * В production отсутствие переменной окружения SESSION_SECRET считается
 * критической ошибкой конфигурации: без неё пришлось бы использовать
 * публично известный fallback, что позволило бы любому подделать cookie
 * сессии и войти под произвольным пользователем (полный обход авторизации).
 * Поэтому в production выполняется fail-fast — приложение не стартует.
 * В режиме разработки допускается небезопасный fallback с предупреждением.
 */

/** Публично известный dev-fallback. НИКОГДА не должен использоваться в production. */
const DEV_FALLBACK_SECRET = "dev-only-insecure-session-secret";

/**
 * Возвращает секрет для express-session.
 *
 * @returns Строка секрета подписи сессионных cookie
 * @throws Error если NODE_ENV === "production" и SESSION_SECRET не задан
 */
export function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (secret && secret.trim().length > 0) {
    return secret;
  }

  if (isProduction) {
    throw new Error(
      "[Session] SESSION_SECRET не задан в production. " +
        "Запуск прерван: без секрета сессии можно подделать cookie и войти под любым пользователем. " +
        "Задайте надёжный случайный SESSION_SECRET (например: openssl rand -hex 32) в переменных окружения."
    );
  }

  console.warn(
    "[Session] SESSION_SECRET не задан — используется небезопасный dev-fallback. " +
      "Это допустимо ТОЛЬКО для локальной разработки."
  );
  return DEV_FALLBACK_SECRET;
}
