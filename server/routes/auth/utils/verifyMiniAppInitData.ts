/**
 * @fileoverview Верификация Telegram Mini App initData (HMAC-SHA256)
 * @module auth/utils/verifyMiniAppInitData
 */

import crypto from "crypto";

/**
 * Верифицирует Telegram Mini App initData через HMAC-SHA256
 *
 * @param initData - строка initData из window.Telegram.WebApp.initData
 * @param botToken - токен бота
 * @returns true если данные валидны
 */
export function verifyMiniAppInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return expectedHash === hash;
}
