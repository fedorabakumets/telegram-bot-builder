/**
 * @fileoverview Общая запись Telegram-пользователя в express-session.
 */

import type { Request } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "./sessionUtils";
import { registerSession, removeSession } from "../../../auth/session-registry";
import type { TelegramUserDB } from "@shared/schema";

/** Входные поля профиля после OIDC / widget */
export interface TelegramLoginProfile {
  /** Числовой Telegram ID либо его десятичная запись из OIDC. */
  id: number | string;
  /** Имя, если оно доступно у провайдера. */
  firstName?: string;
  /** Фамилия пользователя. */
  lastName?: string;
  /** Публичное имя Telegram. */
  username?: string;
  /** Адрес фотографии профиля. */
  photoUrl?: string;
  /** Время подтверждения авторизации. */
  authDate?: number;
}

/** Результат применения логина к сессии */
export interface ApplyTelegramLoginResult {
  /** Сохранённый пользователь. */
  user: TelegramUserDB;
  /** Была ли заменена авторизованная учётная запись. */
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

  // Не допускаем округления ID и преобразования пустых строк, дробей или экспонент.
  const id = typeof profile.id === "number" ? profile.id
    : typeof profile.id === "string" && /^\d+$/.test(profile.id) ? Number(profile.id) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Некорректный Telegram user id");
  }
  // В OIDC имя необязательно, но хранилище требует непустое значение.
  const firstName = profile.firstName?.trim() || profile.username?.trim() || "User";
  const userData = await storage.getTelegramUserOrCreate({
    id,
    firstName,
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
