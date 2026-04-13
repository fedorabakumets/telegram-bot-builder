/**
 * @fileoverview Хендлер dev-входа по Telegram ID без верификации.
 * Доступен ТОЛЬКО в NODE_ENV=development.
 * @module auth/handlers/devLoginHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { regenerateSession, saveSession } from '../utils/sessionUtils';

/**
 * Обрабатывает dev-вход: создаёт/находит пользователя по Telegram ID,
 * регенерирует сессию и мигрирует ВСЕ гостевые проекты на этого пользователя.
 * Возвращает 403 если NODE_ENV !== 'development'.
 *
 * @param req - Объект запроса (тело: { id, firstName, username? })
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function handleDevLogin(req: Request, res: Response): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({ success: false, error: 'Forbidden: только в development' });
    return;
  }

  try {
    const { id, firstName, username } = req.body;

    if (!id || !firstName) {
      res.status(400).json({ success: false, error: 'id и firstName обязательны' });
      return;
    }

    const userData = await storage.getTelegramUserOrCreate({
      id: Number(id),
      firstName: String(firstName),
      username: username ? String(username) : undefined,
    });

    if (!req.session) {
      res.status(500).json({ success: false, error: 'Сессия не инициализирована' });
      return;
    }

    await regenerateSession(req);
    req.session.telegramUser = userData;
    await saveSession(req);

    // Мигрируем ВСЕ гостевые проекты — включая накопленные от прошлых сессий
    await storage.migrateAllGuestProjects(userData.id);

    console.log(`🛠️ Dev-login: ${firstName} (@${username ?? '—'}), ID: ${userData.id}`);

    res.json({ success: true, user: userData });
  } catch (error: any) {
    console.error('Dev-login error:', error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Ошибка dev-входа' });
  }
}
