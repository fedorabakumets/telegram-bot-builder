/**
 * @fileoverview Получение ADMIN_API_KEY для входа в /admin
 * @module server/admin/resolve-admin-key
 */

/** Dev-fallback. Только для локальной разработки без env. */
const DEV_FALLBACK_ADMIN_KEY = "dev-only-insecure-admin-key";

/**
 * Возвращает ключ админки из окружения или dev-fallback.
 * @returns Ключ или null, если админка отключена (production без env)
 */
export function resolveAdminApiKey(): string | null {
  const key = process.env.ADMIN_API_KEY?.trim();
  if (key) return key;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[Admin] ADMIN_API_KEY не задан — /admin и защищённая документация недоступны. " +
        "Задайте ADMIN_API_KEY (openssl rand -hex 32).",
    );
    return null;
  }

  console.warn(
    "[Admin] ADMIN_API_KEY не задан — используется небезопасный dev-fallback. " +
      "Только для локальной разработки.",
  );
  return DEV_FALLBACK_ADMIN_KEY;
}

/**
 * Проверяет, настроена ли админ-панель (есть ключ для проверки входа).
 * @returns true, если вход в /admin возможен
 */
export function isAdminEnabled(): boolean {
  return resolveAdminApiKey() !== null;
}
