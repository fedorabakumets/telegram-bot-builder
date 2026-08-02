/**
 * @fileoverview Хендлер перезапуска всех запущенных ботов проекта
 * @module botManagement/handlers/botRestartAllHandler
 */

import type { Request, Response } from 'express';
import { startBot } from '../../../bots/startBot';
import { stopBot } from '../../../bots/stopBot';
import {
  RESTART_ALL_BATCH_COOLDOWN_MS,
  START_STAGGER_MS,
  sleepMs,
} from '../../../bots/restartTiming';
import { storage } from '../../../storages/storage';

/**
 * Результат перезапуска одного токена
 */
interface TokenRestartResult {
  /** Идентификатор токена */
  tokenId: number;
  /** Признак успешного перезапуска */
  success: boolean;
  /** Идентификатор нового процесса */
  processId?: string;
  /** Сообщение об ошибке при неудаче */
  error?: string;
}

/**
 * Обрабатывает запрос на перезапуск всех запущенных ботов проекта.
 * Фазы: stop всех → пауза cooldown (getUpdates) → start со stagger.
 * @param req - Express request с params.id
 * @param res - Express response
 */
export async function handleBotRestartAll(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id);

    const tokens = await storage.getBotTokensByProject(projectId);
    if (!tokens.length) {
      res.status(404).json({ message: 'Токены проекта не найдены' });
      return;
    }

    const runningTokens = (
      await Promise.all(
        tokens.map(async (t) => {
          const instance = await storage.getBotInstanceByToken(t.id);
          return instance?.status === 'running' ? t : null;
        }),
      )
    ).filter(Boolean) as typeof tokens;

    if (!runningTokens.length) {
      res.json({ message: 'Нет запущенных ботов', restarted: 0 });
      return;
    }

    // Фаза 1: остановить всех
    const stopped: Array<{ tokenId: number; token: string }> = [];
    const stopFailed: TokenRestartResult[] = [];
    for (const token of runningTokens) {
      const stopResult = await stopBot(projectId, token.id);
      if (stopResult.success) {
        stopped.push({ tokenId: token.id, token: token.token });
      } else {
        stopFailed.push({
          tokenId: token.id,
          success: false,
          error: stopResult.error || 'Ошибка остановки',
        });
      }
    }

    // Фаза 2: одна пауза на освобождение getUpdates у Telegram
    if (stopped.length > 0) {
      console.log(
        `[restart-all] project=${projectId}: ждём ${RESTART_ALL_BATCH_COOLDOWN_MS}мс после stop ${stopped.length} ботов`,
      );
      await sleepMs(RESTART_ALL_BATCH_COOLDOWN_MS);
    }

    // Фаза 3: запуск со stagger
    const results: TokenRestartResult[] = [...stopFailed];
    for (let i = 0; i < stopped.length; i++) {
      const { tokenId, token } = stopped[i];
      if (i > 0) await sleepMs(START_STAGGER_MS);
      const startResult = await startBot(projectId, token, tokenId);
      if (startResult.success) {
        results.push({ tokenId, success: true, processId: startResult.processId });
      } else {
        results.push({
          tokenId,
          success: false,
          error: startResult.error || 'Ошибка запуска',
        });
      }
    }

    const restarted = results.filter((r) => r.success).length;
    const failed = results.length - restarted;
    res.json({ restarted, failed, results });
  } catch (error) {
    console.error('Ошибка перезапуска всех ботов:', error);
    res.status(500).json({ message: 'Не удалось перезапустить ботов' });
  }
}
