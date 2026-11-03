/**
 * @fileoverview Удаление токена проекта: ACL через hasProjectAccess + stop + WS
 * @module server/routes/botTokens/handlers/deleteProjectTokenHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { stopBot } from '../../../bots/stopBot';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/**
 * DELETE /api/projects/:projectId/tokens/:tokenId
 * Доступ: владелец или коллаборатор проекта токена (requireTokenOwnership до вызова).
 * Дополнительно сверяет token.projectId с :projectId (защита от IDOR).
 * @param req - Express request
 * @param res - Express response
 */
export async function deleteProjectTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const tokenId = parseInt(req.params.tokenId, 10);
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(tokenId) || isNaN(projectId)) {
      res.status(400).json({ message: 'Некорректный projectId или tokenId' });
      return;
    }

    const existingToken = await storage.getBotToken(tokenId);
    if (!existingToken || existingToken.projectId !== projectId) {
      res.status(404).json({ message: 'Токен не найден в этом проекте' });
      return;
    }

    try {
      const stopped = await stopBot(projectId, tokenId);
      if (!stopped.success) {
        res.status(409).json({ message: 'Остановка не подтверждена; токен не удалён', outcome: 'unknown', sideEffects: { runtimeApply: 'unknown' } }); return;
      }
    } catch {
      res.status(409).json({ message: 'Остановка не подтверждена; токен не удалён', outcome: 'unknown' }); return;
    }

    const success = await storage.deleteBotToken(tokenId);
    if (!success) {
      res.status(404).json({ message: 'Токен не найден' });
      return;
    }

    void broadcastProjectEvent(projectId, {
      type: 'token-deleted',
      projectId,
      tokenId,
      data: { tokenId, tokenName: existingToken.name },
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('[DeleteToken] broadcastProjectEvent:', err));

    res.json({ message: 'Token deleted successfully', effect: 'application', outcome: 'saved', persistence: { confirmed: true, method: 'returning', projectId, tokenId }, sideEffects: { runtimeApply: 'stopped' } });
  } catch (error) {
    console.error('[DeleteToken] Ошибка удаления токена проекта:', error);
    res.status(500).json({ message: 'Не удалось удалить токен' });
  }
}
