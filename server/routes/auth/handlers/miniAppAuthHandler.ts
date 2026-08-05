/**
 * @fileoverview Хендлер авторизации через Telegram Mini App initData
 * @module auth/handlers/miniAppAuthHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "../utils/sessionUtils";
import { getSetting } from "../../../services/app-settings.service";
import { verifyMiniAppInitData } from "../utils/verifyMiniAppInitData";

/**
 * Хендлер авторизации через Telegram Mini App initData.
 * Верифицирует initData и создаёт/обновляет сессию пользователя.
 * При смене аккаунта регенерирует session (как POST /telegram).
 *
 * @param req - Объект запроса (тело: initData)
 * @param res - Объект ответа
 * @returns Promise без значения
 */
export async function handleMiniAppAuth(req: Request, res: Response): Promise<void> {
  try {
    const { initData } = req.body;
    if (!initData) {
      res.status(400).json({ success: false, error: "initData обязателен" });
      return;
    }

    const botToken = await getSetting("telegram_bot_token");
    if (!botToken) {
      if (process.env.NODE_ENV !== "development") {
        res.status(500).json({ success: false, error: "Bot token не настроен" });
        return;
      }
    } else if (!verifyMiniAppInitData(initData, botToken)) {
      res.status(401).json({ success: false, error: "Невалидный initData" });
      return;
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (!userJson) {
      res.status(400).json({ success: false, error: "Нет данных пользователя в initData" });
      return;
    }

    const tgUser = JSON.parse(userJson);
    const userData = await storage.getTelegramUserOrCreate({
      id: Number(tgUser.id),
      firstName: tgUser.first_name || "",
      lastName: tgUser.last_name,
      username: tgUser.username,
      photoUrl: tgUser.photo_url,
    });

    if (!req.session) {
      res.status(500).json({ success: false, error: "Сессия не инициализирована" });
      return;
    }

    const existingUserId = req.session.telegramUser?.id;
    const isSameUser = existingUserId && Number(existingUserId) === Number(userData.id);
    const isGuestSession = !existingUserId;
    let switched = false;

    if (isSameUser || isGuestSession) {
      const oldSessionId = isGuestSession ? req.session.id : null;
      req.session.telegramUser = userData;
      await saveSession(req);
      if (oldSessionId) {
        await storage.migrateGuestProjects(oldSessionId, userData.id);
      }
    } else {
      switched = true;
      const oldSessionId = req.session.id;
      await regenerateSession(req);
      req.session.telegramUser = userData;
      await saveSession(req);
      if (oldSessionId) {
        await storage.migrateGuestProjects(oldSessionId, userData.id);
      }
    }

    console.log(
      `✅ Mini App авторизация: ${tgUser.first_name} (@${tgUser.username}), ID: ${userData.id}` +
        (switched ? " [switch]" : ""),
    );

    res.json({ success: true, user: userData, switched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка авторизации";
    console.error("Mini App auth error:", message);
    res.status(500).json({ success: false, error: message });
  }
}
