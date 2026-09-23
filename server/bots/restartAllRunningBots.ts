/**
 * @fileoverview Перезапуск всех запущенных ботов одного проекта
 * @module server/bots/restartAllRunningBots
 */

import { startBot } from './startBot';
import { stopBot } from './stopBot';
import {
  RESTART_ALL_BATCH_COOLDOWN_MS,
  START_STAGGER_MS,
  sleepMs,
} from './restartTiming';
import { storage } from '../storages/storage';

/** Результат перезапуска одного бота проекта */
export interface TokenRestartResult {
  /** Идентификатор бота в проекте */
  tokenId: number;
  /** Признак успешного перезапуска */
  success: boolean;
  /** Идентификатор нового процесса */
  processId?: string;
  /** Сообщение об ошибке при неудаче */
  error?: string;
}

/** Итог перезапуска всех запущенных ботов проекта */
export interface RestartAllRunningBotsResult {
  /** У проекта нет подключённых ботов */
  ok: boolean;
  /** Сколько ботов снова запущено */
  restarted: number;
  /** Сколько попыток завершились ошибкой */
  failed: number;
  /** Подробности по каждому боту */
  results: TokenRestartResult[];
  /** Пояснение, если перезапускать было некого */
  message?: string;
}

/**
 * Останавливает всех работающих ботов проекта и запускает их снова.
 * Выключенных не трогает. После остановки одна пауза, затем запуск по очереди.
 * @param projectId - Идентификатор проекта
 * @returns Итог: нет ботов, некого перезапускать или сводка по каждому
 */
export async function restartAllRunningBots(
  projectId: number,
): Promise<RestartAllRunningBotsResult> {
  const tokens = await storage.getBotTokensByProject(projectId);
  if (!tokens.length) {
    return { ok: false, restarted: 0, failed: 0, results: [], message: 'Токены проекта не найдены' };
  }

  const runningTokens = (
    await Promise.all(
      tokens.map(async (token) => {
        const instance = await storage.getBotInstanceByToken(token.id);
        return instance?.status === 'running' ? token : null;
      }),
    )
  ).filter((token): token is (typeof tokens)[number] => token != null);

  if (!runningTokens.length) {
    return { ok: true, restarted: 0, failed: 0, results: [], message: 'Нет запущенных ботов' };
  }

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

  if (stopped.length > 0) {
    console.log(
      `[restart-all] project=${projectId}: ждём ${RESTART_ALL_BATCH_COOLDOWN_MS}мс после stop ${stopped.length} ботов`,
    );
    await sleepMs(RESTART_ALL_BATCH_COOLDOWN_MS);
  }

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

  const restarted = results.filter((item) => item.success).length;
  return { ok: true, restarted, failed: results.length - restarted, results };
}
