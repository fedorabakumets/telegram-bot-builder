/**
 * @fileoverview Общая запись Telegram-пользователя в express-session.
 */

import type { Request } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "./sessionUtils";
import { registerSession, removeSession } from "../../../auth/session-registry";
import type { TelegramUserDB } from "@shared/schema";
import type { CreateTelegramUserInput } from "../types";

/** Нормализованные поля профиля Telegram перед записью в сессию и БД. */
export type TelegramLoginProfile = CreateTelegramUserInput;

/** Результат применения логина к сессии */
export interface ApplyTelegramLoginResult {
  user: TelegramUserDB;
  switched: boolean;
}

/**
 * Создаёт/обновляет пользователя и привязывает его к текущей сессии.
 * @param req - Express request с session
 * @param profile - профиль Telegram
 * @returns пользователь и флаг смены аккаунта
 */
export async function applyTelegramLogin(
  req: Request,
  profile: TelegramLoginProfile,
): Promise<ApplyTelegramLoginResult> {
  if (!req.session) {
    throw new Error("Сессия не инициализирована");
  }

  const userData = await storage.getTelegramUserOrCreate({
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    photoUrl: profile.photoUrl,
    authDate: profile.authDate,
  });

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
    await removeSession(req);
    await regenerateSession(req);
    req.session.telegramUser = userData;
    await saveSession(req);
    if (oldSessionId) {
      await storage.migrateGuestProjects(oldSessionId, userData.id);
    }
  }

  await registerSession(req, userData);
  return { user: userData, switched };
}
