/**
 * @fileoverview GET /api/auth/telegram/callback — обмен code и установка сессии.
 */

import type { Request, Response } from "express";
import { applyTelegramLogin } from "../utils/applyTelegramLogin";
import { exchangeTelegramOidcCode } from "../utils/telegramOidcExchange";
import {
  getTelegramUserIdFromToken,
  verifyTelegramIdToken,
} from "../utils/telegramJwks";
import { sanitizeReturnTo } from "../utils/telegramOidcRedirect";
import { saveSession } from "../utils/sessionUtils";

/**
 * Достаёт profile-claims из payload id_token (уже проверенного).
 * @param idToken - JWT
 * @returns поля профиля
 */
function readIdTokenProfile(idToken: string): {
  name?: string;
  preferredUsername?: string;
  picture?: string;
  authDate?: number;
} {
  const payloadB64 = idToken.split(".")[1];
  if (!payloadB64) return {};
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as Record<
    string,
    unknown
  >;
  return {
    name: typeof payload.name === "string" ? payload.name : undefined,
    preferredUsername:
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : typeof payload.username === "string"
          ? payload.username
          : undefined,
    picture:
      typeof payload.picture === "string"
        ? payload.picture
        : typeof payload.photo_url === "string"
          ? payload.photo_url
          : undefined,
    authDate:
      typeof payload.auth_date === "number"
        ? payload.auth_date
        : typeof payload.iat === "number"
          ? payload.iat
          : undefined,
  };
}

/**
 * Завершает OIDC redirect-flow и возвращает пользователя в приложение.
 * @param req - Express request (?code&state)
 * @param res - Express response
 */
export async function handleTelegramOidcCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const fail = (message: string) => {
    const q = new URLSearchParams({ auth_error: message });
    res.redirect(302, `/?${q.toString()}`);
  };

  try {
    if (!req.session?.telegramOidc) {
      fail("Сессия входа истекла, попробуйте ещё раз");
      return;
    }

    const pending = req.session.telegramOidc;
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const oauthError =
      typeof req.query.error === "string" ? req.query.error : "";

    if (oauthError) {
      fail(oauthError);
      return;
    }
    if (!code || !state || state !== pending.state) {
      fail("Некорректный ответ Telegram (state/code)");
      return;
    }

    const tokens = await exchangeTelegramOidcCode({
      code,
      redirectUri: pending.redirectUri,
      codeVerifier: pending.codeVerifier,
    });

    const verified = await verifyTelegramIdToken(tokens.id_token);
    if (!verified) {
      fail("Невалидный id_token");
      return;
    }

    const userId = getTelegramUserIdFromToken(verified);
    if (userId == null) {
      fail("В id_token нет Telegram user id");
      return;
    }

    const profile = readIdTokenProfile(tokens.id_token);
    const nameParts = (profile.name || "").trim().split(/\s+/).filter(Boolean);
    const returnTo = sanitizeReturnTo(pending.returnTo);

    delete req.session.telegramOidc;
    await saveSession(req);

    const { user, switched } = await applyTelegramLogin(req, {
      id: userId,
      firstName: nameParts[0] || profile.preferredUsername || "User",
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
      username: profile.preferredUsername,
      photoUrl: profile.picture,
      authDate: profile.authDate,
    });

    console.log(
      `✅ Telegram OIDC: ${user.firstName} (@${user.username}), ID: ${user.id}` +
        (switched ? " [switch]" : ""),
    );

    res.redirect(302, returnTo);
  } catch (error) {
    console.error("[Telegram OIDC] callback failed:", error);
    fail("Ошибка входа через Telegram");
  }
}
