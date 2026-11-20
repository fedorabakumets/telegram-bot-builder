/**
 * @fileoverview Флаги Secure/SameSite для session cookie
 * @module server/utils/resolveSessionCookie
 */

import type { Request } from "express";

/** Срок жизни сессии в миллисекундах. */
export const SESSION_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Сведения о соединении, на которых основан режим cookie. */
type SessionCookieRequest = Pick<Request, "headers" | "secure"> & {
  /** Фактические адреса TCP, которые не задаются HTTP-заголовками. */
  socket: Pick<Request["socket"], "localAddress" | "remoteAddress"> & {
    /** Признак TLS при WebSocket-запросе до обработки Express. */
    encrypted?: boolean;
  };
};

/** Адреса прямого локального соединения для IPv4 и IPv6. */
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/**
 * Разрешает исключение только для прямого локального HTTP-запроса.
 * @param req - Сведения о запросе и сокете.
 * @returns Нужно ли устанавливать Secure.
 */
export function shouldUseSecureSessionCookie(req: SessionCookieRequest): boolean {
  if (req.secure || req.socket.encrypted || process.env.COOKIE_SECURE === "true"
    || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL) return true;
  const baseUrl = process.env.API_BASE_URL || process.env.WEBHOOK_BASE_URL || "";
  if (baseUrl.trim().toLowerCase().startsWith("https://")) return true;
  if (process.env.NODE_ENV === "production") {
    /** Собранный сервер включает локальный HTTP только по явному запросу. */
    const host = process.env.HOST?.trim();
    const localHost = host === "127.0.0.1" || host === "::1" || host === "localhost";
    if (!localHost || process.env.COOKIE_SECURE !== "false") return true;
  }
  const localSocket = LOOPBACK_ADDRESSES.has(req.socket.localAddress ?? "")
    && LOOPBACK_ADDRESSES.has(req.socket.remoteAddress ?? "");
  const host = req.headers.host ?? "";
  const localHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/i.test(host);
  const forwarded = Object.keys(req.headers).some(key =>
    key === "forwarded" || key === "x-real-ip" || key === "via" || key.startsWith("x-forwarded-"));
  return !localSocket || !localHost || forwarded;
}

/**
 * Применяет режим запроса к созданной или загруженной сессии.
 * @param req - Запрос с загруженной сессией.
 */
export function applySessionCookiePolicy(req: Request): void {
  if (!req.session?.cookie) return;
  const secure = shouldUseSecureSessionCookie(req);
  req.session.cookie.httpOnly = true;
  req.session.cookie.secure = secure;
  req.session.cookie.sameSite = secure ? "none" : "lax";
}
