/**
 * @fileoverview Хендлеры роутов Setup Wizard
 *
 * Обрабатывают запросы первоначальной настройки приложения:
 * проверку статуса и сохранение параметров Telegram.
 *
 * @module server/routes/setup/setupHandlers
 */

import type { Request, Response } from "express";
import {
  isConfigured,
  setSetting,
} from "../../services/app-settings.service";

/**
 * Возвращает статус настройки приложения
 *
 * GET /api/setup/status
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns `{ configured: boolean }` — всегда 200
 */
export async function handleGetSetupStatus(
  _req: Request,
  res: Response
): Promise<void> {
  const configured = await isConfigured();
  res.json({ configured });
}

/**
 * Сохраняет параметры первоначальной настройки приложения
 *
 * POST /api/setup
 *
 * @param req - Объект запроса с телом `{ telegramClientId, telegramClientSecret, telegramBotUsername }`
 * @param res - Объект ответа
 * @returns 201 при успехе, 400 при невалидных данных, 409 если уже настроено, 500 при ошибке
 */
export async function handlePostSetup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (await isConfigured()) {
      res.status(409).json({ error: "Приложение уже настроено" });
      return;
    }

    const { telegramClientId, telegramClientSecret, telegramBotUsername } =
      req.body;

    // Валидация telegramClientId — непустая строка или число
    if (
      telegramClientId === undefined ||
      telegramClientId === null ||
      String(telegramClientId).trim() === ""
    ) {
      res.status(400).json({ error: "telegramClientId обязателен" });
      return;
    }

    // Валидация telegramClientSecret — непустая строка
    if (
      typeof telegramClientSecret !== "string" ||
      telegramClientSecret.trim() === ""
    ) {
      res.status(400).json({ error: "telegramClientSecret обязателен" });
      return;
    }

    // Валидация telegramBotUsername — непустая строка без @
    if (
      typeof telegramBotUsername !== "string" ||
      telegramBotUsername.trim() === ""
    ) {
      res.status(400).json({ error: "telegramBotUsername обязателен" });
      return;
    }

    await setSetting("telegram_client_id", String(telegramClientId));
    await setSetting("telegram_client_secret", telegramClientSecret);
    await setSetting(
      "telegram_bot_username",
      telegramBotUsername.replace("@", "")
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("[setup] Ошибка при сохранении настроек:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
