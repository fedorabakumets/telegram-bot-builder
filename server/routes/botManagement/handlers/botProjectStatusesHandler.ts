/**
 * @fileoverview Хендлер GET /api/projects/:id/bot/statuses — статусы всех ботов проекта
 * @module botManagement/handlers/botProjectStatusesHandler
 */

import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { reconcileLaunchHistoryForToken } from '../../../bots/reconcileLaunchHistory';
import { resolveActualBotStatus, type ActualBotStatus, type RunnerInspectionCache } from '../resolve-actual-bot-status';
import { mapProjectBotStatusItems } from '../map-project-bot-status-items';
import { resolveStoppedErrorMessage } from '../../../bots/resolveStoppedErrorMessage';
import { isTokenPendingRestore } from '../../../bots/restoreState';
import { isBotStarting } from '../../../bots/botStartState';
import { isBotFrozen } from '../../../bots/frozenBotStatus';

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
    const liveByTokenId = new Map<number, ActualBotStatus>();
    const inspectionCache: RunnerInspectionCache = new Map();

    for (const token of tokens) {
      const instance = instanceByTokenId.get(token.id);
      const live = await resolveActualBotStatus(projectId, token.id, instance, false, inspectionCache);
      liveByTokenId.set(token.id, live);
      if (!instance) continue;
      if ((live === 'running' || live === 'stopped') && instance.status !== live && !isBotStarting(token.id)) {
        await storage.updateBotInstance(instance.id, {
          status: live,
          errorMessage: resolveStoppedErrorMessage(instance.errorMessage, live),
        });
        instance.status = live;
      }
      if (live === 'running' || live === 'stopped') {
        await reconcileLaunchHistoryForToken(token.id, live === 'running');
      }
    }

    const tokenIdList = tokens.map((token) => token.id);
    res.json({
      restoreInProgress: tokenIdList.some((id) => isTokenPendingRestore(id)),
      statuses: mapProjectBotStatusItems(
        tokenIdList,
        instanceByTokenId,
        (tokenId) => liveByTokenId.get(tokenId) ?? 'stopped',
        (tokenId) => isTokenPendingRestore(tokenId),
      ).map((item) => ({ ...item, frozen: isBotFrozen(projectId, item.tokenId) })),
    });
  } catch (error) {
    console.error('[BotProjectStatuses] Ошибка:', error);
    res.status(500).json({ message: 'Не удалось получить статусы ботов' });
  }
}
