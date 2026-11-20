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
 * Включает защиту cookie в production и при явном использовании HTTPS.
 * Локальный HTTP в production допускается только при привязке к loopback
 * и явном `COOKIE_SECURE=false`.
 *
 * @returns true если cookie должны быть Secure + SameSite=None
 */
export function shouldUseSecureSessionCookie(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL) {
    return true;
  }
  const baseUrl = process.env.API_BASE_URL || process.env.WEBHOOK_BASE_URL || "";
  if (baseUrl.trim().toLowerCase().startsWith("https://")) return true;
  /** Разрешаем локальный тест собранной версии без ослабления внешнего сервера. */
  const listenHost = process.env.HOST?.trim();
  const loopback = listenHost === "127.0.0.1" || listenHost === "::1" || listenHost === "localhost";
  return !loopback || process.env.COOKIE_SECURE !== "false";
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
