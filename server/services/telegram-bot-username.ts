/**
 * @fileoverview Резолв username бота через Telegram getMe API
 * @module server/services/telegram-bot-username
 */

import { fetchWithProxy } from "../utils/telegram-proxy";

/** Ответ Telegram API getMe */
interface TelegramGetMeResult {
  /** Успех запроса */
  ok?: boolean;
  /** Данные бота */
  result?: { username?: string };
}

/**
 * Получает username бота по токену через Telegram getMe.
 * @param botToken - Токен бота
 * @returns Username без @ или undefined при ошибке
 */
export async function fetchBotUsernameFromToken(
  botToken: string,
): Promise<string | undefined> {
  const token = botToken.trim();
  if (!token) return undefined;

  try {
    const response = await fetchWithProxy(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    const data = (await response.json()) as TelegramGetMeResult;
    if (!response.ok || !data.ok || !data.result?.username) {
      return undefined;
    }
    return data.result.username.replace(/^@/, "");
  } catch (err) {
    console.warn("[AppSettings] getMe failed:", err);
    return undefined;
  }
}
