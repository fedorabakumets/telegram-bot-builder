/**
 * @fileoverview Хендлер публичной конфигурации приложения
 *
 * Отдаёт клиенту публичные переменные в рантайме.
 * Читает значения из таблицы app_settings (БД), с fallback на process.env
 * для обратной совместимости со старыми деплоями.
 *
 * @module auth/handlers/configHandler
 */

import type { Request, Response } from "express";
import { getSetting } from "../../../services/app-settings.service";

/**
 * Возвращает публичную конфигурацию приложения.
 * Порядок поиска: БД (app_settings) → process.env (fallback).
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function handlePublicConfig(_req: Request, res: Response): Promise<void> {
  const clientId = await getSetting("telegram_client_id");
  const botUsername = await getSetting("telegram_bot_username");

  res.json({
    /** Числовой Client ID для Telegram Login Widget */
    telegramClientId: Number(clientId) || 0,
    /** Имя бота для Telegram Login Widget (без @) */
    telegramBotUsername: botUsername || "",
  });
}
