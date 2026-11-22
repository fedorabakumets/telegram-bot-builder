/**
 * @fileoverview Публичный origin и redirect_uri для Telegram OIDC.
 */

import type { Request } from "express";

/** Путь callback OIDC на нашем API */
export const TELEGRAM_OIDC_CALLBACK_PATH = "/api/auth/telegram/callback";

/**
 * Собирает публичный origin запроса (учитывает ngrok / proxy).
 * @param req - Express request
 * @returns origin без завершающего слэша
 */
export function resolvePublicOrigin(req: Request): string {
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim();
  const host = (req.get("x-forwarded-host") || req.get("host") || "localhost:5000")
    .split(",")[0]
    .trim();
  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Redirect URI, который должен совпадать с BotFather Allowed URLs.
 * @param req - Express request
 * @returns полный callback URL
 */
export function resolveTelegramOidcRedirectUri(req: Request): string {
  return `${resolvePublicOrigin(req)}${TELEGRAM_OIDC_CALLBACK_PATH}`;
}

/**
 * Разрешает только относительный return_to внутри приложения.
 * @param raw - значение из query
 * @returns безопасный путь или `/`
 */
export function sanitizeReturnTo(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  if (raw.includes("://") || raw.includes("\\")) return "/";
  return raw;
}
