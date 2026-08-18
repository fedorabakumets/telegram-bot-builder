/**
 * @fileoverview Хендлер GET /api/projects/:id/bot/statuses — статусы всех ботов проекта
 * @module botManagement/handlers/botProjectStatusesHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { reconcileLaunchHistoryForToken } from '../../../bots/reconcileLaunchHistory';
import { computeLiveBotStatus } from '../compute-live-bot-status';
import { mapProjectBotStatusItems } from '../map-project-bot-status-items';

/**
 * Запрещает кэш ответа со статусами
 * @param res - Express response
 * @returns void
 */
function setNoStore(res: Response): void {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

/**
 * Отдаёт live-статусы всех токенов проекта одним ответом.
 * Доступ уже проверен requireProjectAccess. Сырой token не отдаётся.
 *
 * @param req - Express request (params.id)
 * @param res - Express response
 * @returns void
 */
export async function handleBotProjectStatuses(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    setNoStore(res);

    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Неверный ID проекта' });
      return;
    }

    const tokens = await storage.getBotTokensByProject(projectId);
    const instances = await storage.getBotInstancesByProject(projectId);
    const instanceByTokenId = new Map(instances.map((row) => [row.tokenId, row]));
    const liveByTokenId = new Map<number, 'running' | 'stopped'>();

    for (const token of tokens) {
      const instance = instanceByTokenId.get(token.id);
      const live = computeLiveBotStatus(projectId, token.id, instance);
      liveByTokenId.set(token.id, live);
      if (!instance) continue;
      if (instance.status !== live) {
        await storage.updateBotInstance(instance.id, {
          status: live,
          errorMessage: live === 'stopped' ? 'Процесс завершен' : null,
        });
        instance.status = live;
      }
      await reconcileLaunchHistoryForToken(token.id, live === 'running');
    }

    res.json({
      statuses: mapProjectBotStatusItems(
        tokens.map((token) => token.id),
        instanceByTokenId,
        (tokenId) => liveByTokenId.get(tokenId) ?? 'stopped',
      ),
    });
  } catch (error) {
    console.error('[BotProjectStatuses] Ошибка:', error);
    res.status(500).json({ message: 'Не удалось получить статусы ботов' });
  }
}
