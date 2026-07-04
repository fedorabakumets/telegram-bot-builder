/**
 * @fileoverview Подписанная admin-cookie (отдельно от пользовательской сессии)
 * @module server/admin/admin-session
 */

import crypto from "crypto";
import type { Request, Response } from "express";

/** Имя httpOnly cookie админки */
export const ADMIN_COOKIE_NAME = "admin_auth";

/** Срок жизни admin-сессии — 7 суток */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Payload подписанного токена */
interface AdminTokenPayload {
  /** Unix ms истечения */
  exp: number;
}

/**
 * Создаёт подписанный admin-токен.
 * @param signingSecret - Секрет подписи (ADMIN_API_KEY)
 * @returns Base64url строка токена
 */
export function createAdminToken(signingSecret: string): string {
  const payload: AdminTokenPayload = { exp: Date.now() + MAX_AGE_MS };
  const body = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", signingSecret).update(body).digest("hex");
  return Buffer.from(JSON.stringify({ body, sig })).toString("base64url");
}

/**
 * Проверяет admin-токен из cookie.
 * @param token - Значение cookie
 * @param signingSecret - Секрет подписи
 * @returns true, если токен валиден и не истёк
 */
export function verifyAdminToken(token: string, signingSecret: string): boolean {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      body: string;
      sig: string;
    };
    const expected = crypto.createHmac("sha256", signingSecret).update(parsed.body).digest("hex");
    if (expected.length !== parsed.sig.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.sig))) {
      return false;
    }
    const payload = JSON.parse(parsed.body) as AdminTokenPayload;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Устанавливает admin-cookie после успешного входа.
 * @param res - Ответ Express
 * @param signingSecret - Секрет подписи
 * @returns void
 */
export function setAdminCookie(res: Response, signingSecret: string): void {
  const token = createAdminToken(signingSecret);
  const maxAgeSec = Math.floor(MAX_AGE_MS / 1000);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`,
  );
}

/**
 * Удаляет admin-cookie.
 * @param res - Ответ Express
 * @returns void
 */
export function clearAdminCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

/**
 * Парсит заголовок Cookie в объект.
 * @param header - Значение заголовка Cookie
 * @returns Карта имя → значение
 */
function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) result[name] = decodeURIComponent(value);
  }
  return result;
}

/**
 * Извлекает admin-токен из запроса.
 * @param req - Запрос Express
 * @returns Значение cookie или undefined
 */
export function getAdminTokenFromRequest(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[ADMIN_COOKIE_NAME];
}
