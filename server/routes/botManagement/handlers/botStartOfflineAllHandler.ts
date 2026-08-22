/**
 * @fileoverview Хендлер массового запуска офлайн-ботов проекта
 * @module botManagement/handlers/botStartOfflineAllHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { storage } from '../../../storages/storage';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';
import {
  toStartOfflineProgressPayload,
  type StartOfflineSource,
} from '../../../terminal/ProjectEvent';
import { isTokenOfflineForBulkStart } from '../isTokenOfflineForBulkStart';
import { isTokenPendingRestore } from '../../../bots/restoreState';
import { shouldSkipBulkStartDuringRestore } from '../../../../shared/should-skip-bulk-start-during-restore';

/** Пауза между стартами, чтобы не устроить thundering herd */
const START_DELAY_MS = 400;

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
 * Запускает всех офлайн-ботов проекта последовательно
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

    for (const t of tokens) {
      if (shouldSkipBulkStartDuringRestore(isTokenPendingRestore(t.id))) {
        skippedRestoring += 1;
        continue;
      }
      const instance = await storage.getBotInstanceByToken(t.id);
      if (isTokenOfflineForBulkStart(instance?.status, t.isActive)) {
        offlineTokens.push(t);
      } else if (instance?.status === 'running') {
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

    for (let i = 0; i < offlineTokens.length; i++) {
      const token = offlineTokens[i];
      const startResult = await startBot(projectId, token.token, token.id);

      if (startResult.success) {
        started += 1;
        results.push({ tokenId: token.id, success: true, processId: startResult.processId });
      } else {
        failed += 1;
        results.push({
          tokenId: token.id,
          success: false,
          error: startResult.error || 'Не удалось запустить',
        });
      }

      await emitProgress(projectId, {
        started,
        failed,
        skipped: skippedRunning,
        total,
        currentTokenId: token.id,
        status: 'running',
        source,
      });

      if (i < offlineTokens.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, START_DELAY_MS));
      }
    }

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
