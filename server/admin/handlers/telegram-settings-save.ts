/**
 * @fileoverview Сохранение настроек Telegram провайдера в app_settings
 * @module server/admin/handlers/telegram-settings-save
 */

import {
  getSetting,
  setSetting,
} from "../../services/app-settings.service";
import { fetchBotUsernameFromToken } from "../../services/telegram-bot-username";

/** Поля Telegram из admin API */
export interface TelegramSettingsInput {
  /** Client ID Login Widget */
  clientId?: string | number;
  /** Client Secret (пустое — не обновлять) */
  clientSecret?: string;
  /** Username без @ (пустое — резолв из token) */
  botUsername?: string;
  /** Bot token (пустое — не обновлять) */
  botToken?: string;
}

/** Результат сохранения Telegram настроек */
export interface TelegramSettingsSaveResult {
  /** Успех операции */
  success: boolean;
  /** Username после сохранения */
  botUsername?: string;
  /** Текст ошибки валидации */
  error?: string;
}

/**
 * Валидирует и сохраняет настройки Telegram в app_settings.
 * @param input - Поля секции telegram
 * @returns Результат с success или error
 */
export async function saveTelegramSettings(
  input: TelegramSettingsInput,
): Promise<TelegramSettingsSaveResult> {
  const clientId = input.clientId;
  if (
    clientId === undefined ||
    clientId === null ||
    String(clientId).trim() === ""
  ) {
    return { success: false, error: "telegram.clientId обязателен" };
  }

  if (
    typeof input.clientSecret === "string" &&
    input.clientSecret.trim() !== ""
  ) {
    await setSetting("telegram_client_secret", input.clientSecret.trim());
  } else {
    const existingSecret = await getSetting("telegram_client_secret");
    if (!existingSecret?.trim()) {
      return { success: false, error: "telegram.clientSecret обязателен" };
    }
  }

  await setSetting("telegram_client_id", String(clientId).trim());

  if (
    typeof input.botToken === "string" &&
    input.botToken.trim() !== ""
  ) {
    await setSetting("telegram_bot_token", input.botToken.trim());
  }

  let username =
    typeof input.botUsername === "string"
      ? input.botUsername.replace(/^@/, "").trim()
      : "";

  if (!username) {
    const token =
      typeof input.botToken === "string" && input.botToken.trim()
        ? input.botToken.trim()
        : await getSetting("telegram_bot_token");
    if (token?.trim()) {
      username = (await fetchBotUsernameFromToken(token)) ?? "";
    }
  }

  if (!username) {
    return {
      success: false,
      error:
        "telegram.botUsername обязателен или задайте валидный telegram.botToken",
    };
  }

  await setSetting("telegram_bot_username", username);

  return { success: true, botUsername: username };
}
