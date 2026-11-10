/**
 * @fileoverview Безопасная проверка настройки без обхода авторизации при сбое хранилища.
 */
import type { Response } from "express";
import { isConfigured } from "../services/app-settings.service";

/**
 * Проверяет настройку; неопределённый результат означает уже отправленный временный отказ.
 * Ошибка не превращается в отсутствие настройки и не раскрывает детали запроса к БД.
 * @param res - Ответ текущего HTTP-запроса
 * @param source - Постоянное имя вызывающего обработчика для диагностики
 * @returns Признак настройки либо undefined после ответа 503
 */
export async function checkSetupAvailability(
  res: Response,
  source: string,
): Promise<boolean | undefined> {
  let configured: boolean;
  try {
    configured = await isConfigured();
  } catch {
    console.warn(`[SetupAvailability] ${source}: проверка настройки временно недоступна`);
    if (!res.headersSent) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Retry-After", "5");
      res.status(503).json({ message: "Сервис временно недоступен. Повторите запрос позже." });
    }
    return undefined;
  }
  return configured;
}
