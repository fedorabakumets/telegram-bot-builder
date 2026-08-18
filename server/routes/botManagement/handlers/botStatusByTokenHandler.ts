/**
 * @fileoverview Хендлер получения статуса бота по токену
 * @module botManagement/handlers/botStatusByTokenHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { findBotProcessPid } from '../utils/processChecker';
import { getOwnerIdFromRequest } from '../../../telegram/auth-middleware';
import { toPublicBotInstance } from '../../botTokens/to-public-bot-token';
import { reconcileLaunchHistoryForToken } from '../../../bots/reconcileLaunchHistory';
import { computeLiveBotStatus } from '../compute-live-bot-status';

/**
 * Обрабатывает GET /api/tokens/:tokenId/bot-status
 * @param req - Express request
 * @param res - Express response
 * @returns void
 */
export async function handleBotStatusByToken(req: Request, res: Response): Promise<void> {
  try {
    const tokenId = Number.parseInt(req.params.tokenId, 10);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const tokenRecord = await storage.getBotToken(tokenId);
    if (!tokenRecord) {
      res.status(404).json({ message: 'Токен не найден' });
      return;
    }
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) {
      res.status(403).json({ message: 'Нет прав доступа' });
      return;
    }
    const hasAccess = await storage.hasProjectAccess(tokenRecord.projectId, ownerId);
    if (!hasAccess) {
      res.status(403).json({ message: 'Нет прав доступа' });
      return;
    }

    const instance = await storage.getBotInstanceByToken(tokenId);
    if (!instance) {
      res.json({ status: 'stopped', instance: null });
      return;
    }

    let actualStatus = computeLiveBotStatus(instance.projectId, tokenId, instance, true);
    const isWorkerPid =
      typeof instance.processId === 'string' && instance.processId.startsWith('worker_');
    if (!isWorkerPid && actualStatus === 'stopped') {
      const realPid = findBotProcessPid(instance.projectId);
      if (realPid) {
        await storage.updateBotInstance(instance.id, { processId: realPid.toString() });
        actualStatus = 'running';
      }
    }

    if (instance.status !== actualStatus) {
      await storage.updateBotInstance(instance.id, {
        status: actualStatus,
        errorMessage: actualStatus === 'stopped' ? 'Процесс завершен' : null,
      });
    }
    await reconcileLaunchHistoryForToken(tokenId, actualStatus === 'running');
    const payload = instance.status === actualStatus
      ? instance
      : { ...instance, status: actualStatus };
    res.json({ status: actualStatus, instance: toPublicBotInstance(payload) });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; stack?: string };
    console.error('[BotStatus] Полная ошибка:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    if (err.message?.includes('Connection terminated unexpectedly')) {
      res.json({ status: 'stopped', instance: null });
      return;
    }
    res.status(500).json({ message: 'Не удалось получить статус бота' });
  }
}
