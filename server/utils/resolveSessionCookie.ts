/**
 * @fileoverview Флаги Secure/SameSite для session cookie
 * @module server/utils/resolveSessionCookie
 */

/**
 * Опции cookie для express-session
 */
export interface SessionCookieOptions {
  /** Срок жизни cookie в миллисекундах */
  maxAge: number;
  /** Cookie недоступна из JS */
  httpOnly: boolean;
  /** Только по HTTPS */
  secure: boolean;
  /** Политика SameSite */
  sameSite: "none" | "lax";
}

/**
 * Нужны ли Secure-cookies (реальный HTTPS).
 * Локальный `npm start` по http://localhost не может использовать Secure —
 * браузер отбросит cookie, и после login все API вернут 401.
 *
 * Переопределение: `COOKIE_SECURE=true|false`.
 *
 * @returns true если cookie должны быть Secure + SameSite=None
 */
export function shouldUseSecureSessionCookie(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  if (process.env.NODE_ENV !== "production") return false;

  // Railway всегда отдаёт приложение по HTTPS
  if (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL) {
    return true;
  }

  const baseUrl = process.env.API_BASE_URL || process.env.WEBHOOK_BASE_URL || "";
  return baseUrl.startsWith("https://");
}

/**
 * Собирает опции session cookie с учётом HTTP/HTTPS окружения
 *
 * @returns Опции cookie для express-session
 */
export function resolveSessionCookieOptions(): SessionCookieOptions {
  const secure = shouldUseSecureSessionCookie();
  return {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
  };
}
