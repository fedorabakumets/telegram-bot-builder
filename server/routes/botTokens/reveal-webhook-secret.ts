/** @fileoverview Явное раскрытие секрета вебхука после проверки владения токеном. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';

/** Возвращает секрет только для указанного проекта без сохранения в HTTP-кеше. */
export async function revealWebhookSecret(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  try {
    const token = await storage.getBotToken(Number(req.params.tokenId));
    if (!token || token.projectId !== Number(req.params.projectId)) {
      res.status(404).json({ message: 'Бот проекта не найден' }); return;
    }
    /** Обычный доступ коллаборатора не даёт права раскрывать серверный секрет. */
    const project = await storage.getBotProject(token.projectId);
    const actorId = getOwnerIdFromRequest(req);
    if (!req.isAdminRequest && (actorId === null || project?.ownerId !== actorId)) {
      res.status(403).json({ message: 'Показать токен может только владелец проекта' }); return;
    }
    if (!token.webhookSecretToken) {
      res.status(404).json({ message: 'Защитный токен ещё не создан' }); return;
    }
    res.json({ value: token.webhookSecretToken });
  } catch {
    res.status(500).json({ message: 'Не удалось получить защитный токен' });
  }
}
