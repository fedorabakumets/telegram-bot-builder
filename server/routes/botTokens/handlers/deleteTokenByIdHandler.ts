/**
 * @fileoverview Удаление токена по id без projectId в URL
 * @module server/routes/botTokens/handlers/deleteTokenByIdHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { stopBot } from '../../../bots/stopBot';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/**
 * DELETE /api/tokens/:tokenId (или :id — см. роут)
 * Доступ уже проверен requireTokenOwnership. Останавливает бота и шлёт token-deleted.
 * @param req - Express request
 * @param res - Express response
 */
export async function deleteTokenByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const raw = req.params.tokenId ?? req.params.id;
    const tokenId = parseInt(raw, 10);
    if (isNaN(tokenId)) {
      res.status(400).json({ message: 'Некорректный id токена' });
      return;
    }

    const existingToken = await storage.getBotToken(tokenId);
    if (!existingToken) {
      res.status(404).json({ message: 'Токен не найден' });
      return;
    }

    try {
      await stopBot(existingToken.projectId, tokenId);
    } catch (stopError) {
      console.warn(`[DeleteTokenById] Не удалось остановить бота ${tokenId}:`, stopError);
    }

    const success = await storage.deleteBotToken(tokenId);
    if (!success) {
      res.status(404).json({ message: 'Токен не найден' });
      return;
    }

    void broadcastProjectEvent(existingToken.projectId, {
      type: 'token-deleted',
      projectId: existingToken.projectId,
      tokenId,
      data: { tokenId, tokenName: existingToken.name },
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('[DeleteTokenById] broadcastProjectEvent:', err));

    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('[DeleteTokenById] Ошибка:', error);
    res.status(500).json({ message: 'Не удалось удалить токен' });
  }
}
