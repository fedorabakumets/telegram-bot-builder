/**
 * @fileoverview Хендлер авторизации через Telegram Mini App initData
 * @module auth/handlers/miniAppAuthHandler
 */

import crypto from 'crypto';
import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { regenerateSession, saveSession } from '../utils/sessionUtils';

/**
 * Верифицирует Telegram Mini App initData через HMAC-SHA256
 * @param initData - строка initData из window.Telegram.WebApp.initData
 * @param botToken - токен бота
 * @returns true если данные валидны
 */
function verifyInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return expectedHash === hash;
}

/**
 * Хендлер авторизации через Telegram Mini App initData.
 * Верифицирует initData и создаёт/обновляет сессию пользователя.
 * @param req - Объект запроса (тело: initData)
 * @param res - Объект ответа
 */
export async function handleMiniAppAuth(req: Request, res: Response): Promise<void> {
  try {
    const { initData } = req.body;
    if (!initData) {
      res.status(400).json({ success: false, error: 'initData обязателен' });
      return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      // В dev-режиме пропускаем верификацию
      if (process.env.NODE_ENV !== 'development') {
        res.status(500).json({ success: false, error: 'Bot token не настроен' });
        return;
      }
    } else if (!verifyInitData(initData, botToken)) {
      res.status(401).json({ success: false, error: 'Невалидный initData' });
      return;
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) {
      res.status(400).json({ success: false, error: 'Нет данных пользователя в initData' });
      return;
    }

    const tgUser = JSON.parse(userJson);
    const userData = await storage.getTelegramUserOrCreate({
      id: tgUser.id,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
      photoUrl: tgUser.photo_url,
    });

    const oldSessionId = req.session?.id;
    await regenerateSession(req);
    req.session.telegramUser = userData;
    await saveSession(req);

    if (oldSessionId) {
      await storage.migrateGuestProjects(oldSessionId, userData.id);
    }

    console.log(`✅ Mini App авторизация: ${tgUser.first_name} (@${tgUser.username}), ID: ${userData.id}`);

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Mini App auth error:', error);
    res.status(500).json({ success: false, error: 'Ошибка авторизации' });
  }
}
