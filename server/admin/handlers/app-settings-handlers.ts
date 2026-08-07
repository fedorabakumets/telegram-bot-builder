/**
 * @fileoverview GET/PUT /admin/api/app-settings
 * @module server/admin/handlers/app-settings-handlers
 */

import type { Request, Response } from "express";
import {
  getSetting,
  isConfigured,
  isTelegramAuthConfigured,
  resolveBotUsername,
} from "../../services/app-settings.service";
import {
  saveTelegramSettings,
  type TelegramSettingsInput,
} from "./telegram-settings-save";

/**
 * GET /admin/api/app-settings — текущие настройки по провайдерам (без секретов).
 * @param _req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminAppSettings(
  _req: Request,
  res: Response,
): Promise<void> {
  const clientId = await getSetting("telegram_client_id");
  const botUsername = await resolveBotUsername();
  const clientSecret = await getSetting("telegram_client_secret");
  const botToken = await getSetting("telegram_bot_token");

  const configured = await isConfigured();
  const telegramConfigured = await isTelegramAuthConfigured();

  res.json({
    configured,
    providers: {
      telegram: {
        clientId: clientId ?? "",
        botUsername: botUsername ?? "",
        clientSecretConfigured: Boolean(clientSecret?.trim()),
        botTokenConfigured: Boolean(botToken?.trim()),
        configured: telegramConfigured,
      },
    },
  });
}

/**
 * PUT /admin/api/app-settings — upsert настроек по секциям провайдеров.
 * @param req - Запрос с body `{ telegram?: TelegramSettingsInput }`
 * @param res - Ответ Express
 */
export async function handlePutAdminAppSettings(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const telegram = req.body?.telegram as TelegramSettingsInput | undefined;

    if (!telegram || typeof telegram !== "object") {
      res.status(400).json({ error: "Ожидается body.telegram с полями настроек" });
      return;
    }

    const result = await saveTelegramSettings(telegram);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const configured = await isConfigured();

    res.json({
      success: true,
      configured,
      providers: {
        telegram: {
          botUsername: result.botUsername,
          configured: await isTelegramAuthConfigured(),
        },
      },
    });
  } catch (err) {
    console.error("[admin] Ошибка сохранения app-settings:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
