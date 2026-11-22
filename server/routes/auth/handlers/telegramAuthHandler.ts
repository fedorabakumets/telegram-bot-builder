/**
 * @fileoverview Хендлер авторизации через Telegram Login Widget (POST JSON).
 *
 * Создаёт/обновляет пользователя, устанавливает session cookie.
 * Поддерживает смену аккаунта и верификацию id_token.
 *
 * @module auth/handlers/telegramAuthHandler
 */

import type { Request, Response } from "express";
import { applyTelegramLogin } from "../utils/applyTelegramLogin";
import { verifyTelegramIdToken, getTelegramUserIdFromToken } from "../utils/telegramJwks";
import { isStrictAuthMode } from "../utils/isStrictAuthMode";

/**
 * Обрабатывает данные авторизации от Telegram Login Widget / SDK.
 * @param req - тело: id, first_name, ..., id_token?
 * @param res - JSON success/user
 */
export async function handleTelegramAuth(req: Request, res: Response): Promise<void> {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, id_token } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: "User ID обязателен" });
      return;
    }

    const strict = isStrictAuthMode();
    if (strict && !id_token) {
      res.status(401).json({ success: false, error: "Требуется id_token для входа" });
      return;
    }

    if (id_token) {
      const verified = await verifyTelegramIdToken(id_token);
      if (!verified) {
        res.status(401).json({ success: false, error: "Невалидный id_token" });
        return;
      }
      const tokenUserId = getTelegramUserIdFromToken(verified);
      if (tokenUserId == null || String(tokenUserId) !== String(id)) {
        res.status(401).json({
          success: false,
          error: "id_token не соответствует user id",
        });
        return;
      }
    }

    const { user: userData, switched } = await applyTelegramLogin(req, {
      id,
      firstName: first_name,
      lastName: last_name,
      username,
      photoUrl: photo_url,
      authDate: auth_date ? parseInt(auth_date.toString()) : undefined,
    });

    console.log(
      `✅ Telegram авторизация: ${first_name} (@${username}), ID: ${userData.id}` +
        (switched ? " [switch]" : ""),
    );

    res.json({
      success: true,
      message: switched ? "Аккаунт переключён" : "Авторизация успешна",
      user: userData,
      switched,
    });
  } catch (error: unknown) {
    console.error("Ошибка авторизации через Telegram:", error);
    res.status(500).json({ success: false, error: "Ошибка авторизации" });
  }
}
