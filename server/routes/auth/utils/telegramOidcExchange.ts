/**
 * @fileoverview Обмен authorization code на токены Telegram OIDC.
 */

import { fetchWithProxy } from "../../../utils/telegram-proxy";
import { getSetting } from "../../../services/app-settings.service";

/** Ответ token endpoint Telegram */
export interface TelegramOidcTokenResponse {
  /** JWT id_token */
  id_token: string;
  /** access_token (может не использоваться) */
  access_token?: string;
  /** Тип токена */
  token_type?: string;
  /** Срок жизни */
  expires_in?: number;
}

/**
 * Меняет code на id_token через oauth.telegram.org/token.
 * @param params - code, redirectUri, codeVerifier
 * @returns тело ответа token endpoint
 */
export async function exchangeTelegramOidcCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TelegramOidcTokenResponse> {
  const clientId = (await getSetting("telegram_client_id"))?.trim();
  const clientSecret = (await getSetting("telegram_client_secret"))?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Telegram OIDC: client_id/client_secret не настроены");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: clientId,
    code_verifier: params.codeVerifier,
  });

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetchWithProxy("https://oauth.telegram.org/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });

  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Telegram token non-JSON (${res.status}): ${raw.slice(0, 120)}`);
  }

  if (!res.ok || typeof data.id_token !== "string") {
    const err = typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(`Telegram token exchange failed: ${err}`);
  }

  return data as unknown as TelegramOidcTokenResponse;
}
