/**
 * @fileoverview API управления активными сессиями текущего пользователя
 * @module auth/handlers/sessionsHandlers
 */

import type { Request, Response } from 'express';
import { listSessions, revokeOtherSessions, revokeSession } from '../../../auth/session-registry';

/** Возвращает активные сессии текущего пользователя */
export async function handleListSessions(req: Request, res: Response): Promise<void> {
  try {
    const sessions = await listSessions(req.user!.id, req.session!.id);
    res.json({ sessions: sessions.map(({ sessionId: _sessionId, ...session }) => session) });
  } catch (error) {
    console.error('Ошибка GET /api/profile/sessions:', error);
    res.status(503).json({ error: 'Сервис сессий временно недоступен' });
  }
}

/** Завершает одну неактивную сессию */
export async function handleRevokeSession(req: Request, res: Response): Promise<void> {
  try {
    const revoked = await revokeSession(req.user!.id, req.params.id, req.session!.id);
    if (!revoked) { res.status(404).json({ error: 'Сессия не найдена или является текущей' }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка DELETE /api/profile/sessions/:id:', error);
    res.status(503).json({ error: 'Сервис сессий временно недоступен' });
  }
}

/** Завершает все сессии, кроме текущей */
export async function handleRevokeOtherSessions(req: Request, res: Response): Promise<void> {
  try {
    const revoked = await revokeOtherSessions(req.user!.id, req.session!.id);
    res.json({ success: true, revoked });
  } catch (error) {
    console.error('Ошибка DELETE /api/profile/sessions:', error);
    res.status(503).json({ error: 'Сервис сессий временно недоступен' });
  }
}
