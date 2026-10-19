/**
 * @fileoverview Управление сессиями аккаунта из админской зоны
 * @module server/admin/handlers/platform-user-sessions-handlers
 */

import type { Request, Response } from 'express';
import { parsePlatformUserId } from './platform-users-params';
import { revokeAllSessionsByAdmin, revokeSessionByAdmin } from '../../auth/session-registry';

/** Завершает одну сессию аккаунта администратором */
export async function handleAdminRevokeUserSession(req: Request, res: Response): Promise<void> {
  const userId = parsePlatformUserId(String(req.params.id ?? ''));
  if (userId == null) { res.status(400).json({ error: 'Неверный идентификатор аккаунта' }); return; }
  try {
    const revoked = await revokeSessionByAdmin(userId, String(req.params.sessionId ?? ''));
    if (!revoked) { res.status(404).json({ error: 'Сессия не найдена' }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error(`[admin] Ошибка завершения сессии аккаунта ${userId}:`, error);
    res.status(503).json({ error: 'Сервис сессий временно недоступен' });
  }
}

/** Завершает все сессии аккаунта администратором */
export async function handleAdminRevokeUserSessions(req: Request, res: Response): Promise<void> {
  const userId = parsePlatformUserId(String(req.params.id ?? ''));
  if (userId == null) { res.status(400).json({ error: 'Неверный идентификатор аккаунта' }); return; }
  try {
    const revoked = await revokeAllSessionsByAdmin(userId);
    res.json({ success: true, revoked });
  } catch (error) {
    console.error(`[admin] Ошибка завершения сессий аккаунта ${userId}:`, error);
    res.status(503).json({ error: 'Сервис сессий временно недоступен' });
  }
}
