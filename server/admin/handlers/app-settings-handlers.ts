/**
 * @fileoverview GET/PUT /admin/api/app-settings
 * @module server/admin/handlers/app-settings-handlers
 */

import type { Request, Response } from "express";
import {
  getAuthLoginMode,
  getSetting,
  isConfigured,
  isTelegramAuthConfigured,
  resolveBotUsername,
} from "../../services/app-settings.service";
import { saveAuthLoginMode } from "./auth-settings-save";
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
  const loginMode = await getAuthLoginMode();

  const configured = await isConfigured();
  const telegramConfigured = await isTelegramAuthConfigured();

  res.json({
    configured,
    auth: {
      loginMode,
      devLoginEnabled: loginMode === "dev_login",
    },
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
 * PUT /admin/api/app-settings — upsert auth mode и секции провайдеров.
 * @param req - Запрос с body `{ auth?, telegram? }`
 * @param res - Ответ Express
 */
export async function handlePutAdminAppSettings(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const auth = req.body?.auth as { loginMode?: string } | undefined;
    const telegram = req.body?.telegram as TelegramSettingsInput | undefined;

    if (auth?.loginMode) {
      const authResult = await saveAuthLoginMode(auth.loginMode);
      if (!authResult.success) {
        res.status(400).json({ error: authResult.error });
        return;
      }
    }

    const loginMode = await getAuthLoginMode();

    if (telegram && typeof telegram === "object") {
      const clientId = String(telegram.clientId ?? "").trim();
      const shouldSaveTelegram =
        clientId !== "" || loginMode === "telegram_widget";

      if (shouldSaveTelegram) {
        const result = await saveTelegramSettings(telegram);
        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }
      }
    }

    const configured = await isConfigured();

    res.json({
      success: true,
      configured,
      auth: {
        loginMode,
        devLoginEnabled: loginMode === "dev_login",
      },
      providers: {
        telegram: {
          configured: await isTelegramAuthConfigured(),
        },
      },
    });
  } catch (err) {
    console.error("[admin] Ошибка сохранения app-settings:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
