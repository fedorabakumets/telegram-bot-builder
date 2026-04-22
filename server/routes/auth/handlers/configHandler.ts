/**
 * @fileoverview Хендлер публичной конфигурации приложения
 *
 * Отдаёт клиенту публичные переменные окружения в рантайме.
 * Решает проблему недоступности VITE_* переменных при Docker-сборке
 * (переменные не попадают в build stage, только в runtime).
 *
 * @module auth/handlers/configHandler
 */

import type { Request, Response } from "express";

/**
 * Возвращает публичную конфигурацию приложения
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 */
export function handlePublicConfig(_req: Request, res: Response): void {
  res.json({
    /** Числовой Client ID для Telegram Login Widget */
    telegramClientId: Number(process.env.TELEGRAM_CLIENT_ID) || Number(process.env.VITE_TELEGRAM_CLIENT_ID) || 0,
    /** Имя бота для Telegram Login Widget (без @) */
    telegramBotUsername: process.env.VITE_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || "",
  });
}
