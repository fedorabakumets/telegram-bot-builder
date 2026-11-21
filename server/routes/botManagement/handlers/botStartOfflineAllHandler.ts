/**
 * @fileoverview Хендлер массового запуска офлайн-ботов проекта
 * @module botManagement/handlers/botStartOfflineAllHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { mapRestoreCandidates } from '../../../bots/restoreGrouping';
import { storage } from '../../../storages/storage';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';
import {
  toStartOfflineProgressPayload,
  type StartOfflineSource,
} from '../../../terminal/ProjectEvent';
import { isTokenOfflineForBulkStart } from '../isTokenOfflineForBulkStart';
import { isTokenPendingRestore } from '../../../bots/restoreState';
import { shouldSkipBulkStartDuringRestore } from '../../../../shared/should-skip-bulk-start-during-restore';
import { setBotDesiredStatus } from '../../../bots/setBotDesiredStatus';
import { resolveActualBotStatus, type RunnerInspectionCache } from '../resolve-actual-bot-status';

/**
 * Результат запуска одного токена (без секретов)
 */
interface TokenStartResult {
  /** ID токена */
  tokenId: number;
  /** Успех */
  success: boolean;
  /** ID процесса при успехе */
  processId?: string;
  /** Ошибка при неудаче */
  error?: string;
}

/**
 * Эмитит WS start-offline-progress (whitelist, без секретов)
 * @param projectId - ID проекта
 * @param payload - Счётчики прогресса
 */
async function emitProgress(
  projectId: number,
  payload: Parameters<typeof toStartOfflineProgressPayload>[0],
): Promise<void> {
  await broadcastProjectEvent(projectId, {
    type: 'start-offline-progress',
    projectId,
    tokenId: payload.currentTokenId,
    timestamp: new Date().toISOString(),
    data: toStartOfflineProgressPayload(payload),
  });
}

/**
 * Запускает офлайн-ботов пятью задачами через общий допуск startBot
 * @param req - Express request (params.id = projectId)
 * @param res - Express response
 */
export async function handleBotStartOfflineAll(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Неверный ID проекта' });
      return;
    }

    const source: StartOfflineSource =
      req.get('x-mcp-agent') || req.get('authorization')?.startsWith('Bearer mcp_')
        ? 'mcp'
        : 'api';

    const tokens = await storage.getBotTokensByProject(projectId);
    if (!tokens.length) {
      res.status(404).json({ message: 'Токены проекта не найдены' });
      return;
    }

    const offlineTokens: typeof tokens = [];
    let skippedRunning = 0;
    let skippedRestoring = 0;
    const inspectionCache: RunnerInspectionCache = new Map();

    for (const t of tokens) {
      if (shouldSkipBulkStartDuringRestore(isTokenPendingRestore(t.id))) {
        skippedRestoring += 1;
        continue;
      }
      const instance = await storage.getBotInstanceByToken(t.id);
      const live = instance
        ? await resolveActualBotStatus(projectId, t.id, instance, false, inspectionCache)
        : 'stopped';
      if (live === 'unknown' || live === 'starting' || live === 'requested') {
        skippedRestoring += 1;
      } else if (isTokenOfflineForBulkStart(live, t.isActive)) {
        offlineTokens.push(t);
      } else if (live === 'running') {
        skippedRunning += 1;
      }
    }

    if (!offlineTokens.length) {
      const message = skippedRestoring > 0
        ? `Идёт восстановление после рестарта, ${skippedRestoring} бот(ов) в очереди`
        : 'Нет офлайн-ботов';
      res.json({
        message,
        started: 0,
        failed: 0,
        skippedRunning,
        skippedRestoring,
        results: [],
      });
      return;
    }

    const total = offlineTokens.length;
    let started = 0;
    let failed = 0;
    const results: TokenStartResult[] = [];

    await emitProgress(projectId, {
      started: 0,
      failed: 0,
      skipped: skippedRunning,
      total,
      status: 'running',
      source,
    });

    // Пять ожидающих задач проекта разделяют глобальные пять мест и интервал 250 мс.
    const orderedResults = await mapRestoreCandidates(offlineTokens, async (token): Promise<TokenStartResult> => {
      let outcome: TokenStartResult;
      try {
        let instance = await storage.getBotInstanceByToken(token.id);
        if (!instance) {
          instance = await storage.createBotInstance({
            projectId, tokenId: token.id, token: token.token, status: 'stopped',
          });
        }
        const generation = await setBotDesiredStatus(instance.id, 'running');
        const current = await storage.getBotInstanceByToken(token.id);
        if (!current || current.desiredStatus !== 'running' || current.desiredGeneration !== generation) {
          outcome = { tokenId: token.id, success: false, error: 'Запуск отменён новым запросом' };
        } else {
          const startResult = await startBot(projectId, token.token, token.id);
          outcome = { tokenId: token.id, success: startResult.success,
            ...(startResult.success ? { processId: startResult.processId }
              : { error: startResult.error || 'Не удалось запустить' }) };
          if (!startResult.success) {
            // Новая остановка пользователя не должна стать ошибкой устаревшего массового запуска.
            const latest = await storage.getBotInstanceByToken(token.id);
            if (latest?.desiredStatus === 'running' && latest.desiredGeneration === generation) {
              await storage.updateBotInstance(instance.id, { status: 'error', errorMessage: outcome.error });
            }
          }
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Не удалось запустить';
        outcome = { tokenId: token.id, success: false,
          error: detail.split(token.token || '\0').join('[скрыто]') };
      }
      if (outcome.success) started++; else failed++;
      // Ошибка уведомления не завершает HTTP-ответ до остальных незавершённых запусков.
      await emitProgress(projectId, {
        started, failed, skipped: skippedRunning, total, currentTokenId: token.id, status: 'running', source,
      }).catch(error => console.error('Ошибка прогресса массового запуска:', error));
      return outcome;
    });
    results.push(...orderedResults);

    await emitProgress(projectId, {
      started,
      failed,
      skipped: skippedRunning,
      total,
      status: 'done',
      source,
    });

    res.json({ started, failed, skippedRunning, skippedRestoring, results });
  } catch (error) {
    console.error('Ошибка массового запуска офлайн-ботов:', error);
    res.status(500).json({ message: 'Не удалось запустить офлайн-ботов' });
  }
}
