/**
 * @fileoverview GET /api/auth/telegram/start — редирект на oauth.telegram.org (code+PKCE).
 */

import type { Request, Response } from "express";
import { getSetting } from "../../../services/app-settings.service";
import { isSkipAuthEnabled } from "../utils/isSkipAuthEnabled";
import {
  createCodeChallenge,
  createCodeVerifier,
  createOidcState,
} from "../utils/telegramOidcPkce";
import {
  resolveTelegramOidcRedirectUri,
  sanitizeReturnTo,
} from "../utils/telegramOidcRedirect";
import { saveSession } from "../utils/sessionUtils";

/**
 * Сохраняет PKCE в сессии и уводит браузер на Telegram OIDC authorize.
 * @param req - Express request
 * @param res - Express response
 */
export async function handleTelegramOidcStart(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (isSkipAuthEnabled()) {
      res.redirect(302, "/api/auth/login");
      return;
    }

    if (!req.session) {
      res.status(500).send("Сессия не инициализирована");
      return;
    }

    const clientId = (await getSetting("telegram_client_id"))?.trim();
    if (!clientId) {
      res.status(503).send("Telegram Client ID не настроен");
      return;
    }

    const codeVerifier = createCodeVerifier();
    const state = createOidcState();
    const returnTo = sanitizeReturnTo(req.query.return_to);
    const redirectUri = resolveTelegramOidcRedirectUri(req);

    req.session.telegramOidc = { state, codeVerifier, returnTo, redirectUri };
    await saveSession(req);

    const url = new URL("https://oauth.telegram.org/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "openid profile telegram:bot_access");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", createCodeChallenge(codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");

    res.redirect(302, url.toString());
  } catch (error) {
    console.error("[Telegram OIDC] start failed:", error);
    res.status(500).send("Не удалось начать вход через Telegram");
  }
}
