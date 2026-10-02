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
import { isSkipAuthEnabled } from "../utils/isSkipAuthEnabled";
import { isPsqlBuiltinEnabled } from "../../../utils/isPsqlBuiltinEnabled";

/**
 * Возвращает публичный базовый URL API для UI (hooks, превью).
 * Приоритет: API_BASE_URL из env → заголовки прокси → host запроса.
 * @param req - Объект запроса
 * @returns Базовый URL без завершающего слэша
 */
function resolvePublicApiBaseUrl(req: Request): string {
  const fromEnv = process.env.API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  const host = (req.get("x-forwarded-host") || req.get("host") || "localhost:5000").split(",")[0].trim();
  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Возвращает публичную конфигурацию приложения.
 * Порядок поиска: БД (app_settings) → process.env (fallback).
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function handlePublicConfig(req: Request, res: Response): Promise<void> {
  const clientId = await getSetting("telegram_client_id");
  const botUsername = await getSetting("telegram_bot_username");

  res.json({
    /** Числовой Client ID для Telegram Login Widget */
    telegramClientId: Number(clientId) || 0,
    /** Имя бота для Telegram Login Widget (без @) */
    telegramBotUsername: botUsername || "",
    /** Dev-login по умолчанию; SKIP_AUTH=false — Telegram Login Widget */
    skipAuth: isSkipAuthEnabled(),
    /** Публичный базовый URL API (API_BASE_URL или origin запроса) */
    apiBaseUrl: resolvePublicApiBaseUrl(req),
    /** Разрешён ли узлу psql_query режим builtin (БД платформы), PSQL_BUILTIN_ENABLED */
    psqlBuiltinEnabled: isPsqlBuiltinEnabled(),
  });
}
