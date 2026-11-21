/**
 * @fileoverview Перезапуск всех запущенных ботов одного проекта
 * @module server/bots/restartAllRunningBots
 */

import { startBotAfterStop } from './startBotAfterStop';
import { stopBot } from './stopBot';
import {
  RESTART_ALL_BATCH_COOLDOWN_MS,
  sleepMs,
} from './restartTiming';
import { storage } from '../storages/storage';
import { admitRestartAll, type RestartAllOptions, type RestartAllProgress } from './restart-all-progress';
import { restartStartPool } from './restartStartPool';
export { RestartAllInProgressError, isRestartAllRunning } from './restart-all-progress';
export type { RestartAllOptions, RestartAllProgress } from './restart-all-progress';

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
 * Выключенных не трогает. После остановки одна пауза, затем до пяти попыток параллельно.
 * Общий лимит пяти запусков и интервал допуска 250 мс применяет startBot.
 * @param projectId - Идентификатор проекта
 * @returns Итог: нет ботов, некого перезапускать или сводка по каждому
 */
export async function restartAllRunningBots(
  projectId: number,
  options: RestartAllOptions = {},
): Promise<RestartAllRunningBotsResult> {
  const release = admitRestartAll(projectId);
  /** Не передавать секрет бота в снимки прогресса и итог операции. */
  const safeError = (error: unknown, token: string, fallback: string) =>
    (error instanceof Error ? error.message : typeof error === 'string' ? error : fallback).split(token || '\0').join('[скрыто]');
  const results: TokenRestartResult[] = [];
  let total = 0, stoppedCount = 0, stopFailed = 0, attempted = 0;
  /** Наблюдатель не должен прерывать уже начатую остановку или запуск ботов. */
  const report = (phase: RestartAllProgress['phase']) => {
    const restarted = results.filter(item => item.success).length;
    try {
      options.onProgress?.({ phase, total, completed: results.length, stopped: stoppedCount,
        stopFailed, attempted, restarted, failed: results.length - restarted,
        results: results.map(item => ({ ...item })) });
    } catch (error) { console.error('[restart-all] Ошибка наблюдателя прогресса:', error); }
  };
  try {
    const tokens = await storage.getBotTokensByProject(projectId);
    if (!tokens.length) {
      report('completed');
      return { ok: false, restarted: 0, failed: 0, results, message: 'Токены проекта не найдены' };
    }
    const runningTokens = [];
    // Читаем состояния последовательно, не создавая всплеск запросов к БД.
    for (const token of tokens) {
      const instance = await storage.getBotInstanceByToken(token.id);
      if (instance?.status === 'running' && instance.desiredStatus !== 'stopped') runningTokens.push(token);
    }
    total = runningTokens.length;
    report('stopping');
    if (!total) {
      report('completed');
      return { ok: true, restarted: 0, failed: 0, results, message: 'Нет запущенных ботов' };
    }
    const stopped: Array<{ tokenId: number; token: string; generation: number }> = [];
    for (const token of runningTokens) {
      try {
        const stopResult = await stopBot(projectId, token.id);
        if (!stopResult.success) throw new Error(stopResult.error || 'Ошибка остановки');
        const instance = await storage.getBotInstanceByToken(token.id);
        if (!instance) throw new Error('После остановки не найден экземпляр бота');
        stopped.push({ tokenId: token.id, token: token.token, generation: instance.desiredGeneration ?? 0 });
        stoppedCount++;
      } catch (error) {
        stopFailed++;
        results.push({ tokenId: token.id, success: false,
          error: safeError(error, token.token, 'Ошибка остановки') });
      }
      report('stopping');
    }
    if (stopped.length) {
      report('cooldown');
      console.log(`[restart-all] project=${projectId}: ждём ${RESTART_ALL_BATCH_COOLDOWN_MS}мс после stop ${stopped.length} ботов`);
      await sleepMs(RESTART_ALL_BATCH_COOLDOWN_MS);
    }
    report('starting');
    // Пул пакета не захватывает допуск повторно: ручные и аварийные старты делят общий startBot limiter.
    const order = new Map(runningTokens.map((token, index) => [token.id, index]));
    await restartStartPool(stopped, async ({ tokenId, token, generation }) => {
      try {
        const current = await storage.getBotInstanceByToken(tokenId);
        if (!current || current.desiredStatus === 'stopped' || current.desiredGeneration !== generation) {
          throw new Error('Перезапуск отменён новым запросом');
        }
        const result = await startBotAfterStop(projectId, token, tokenId);
        results.push({ tokenId, success: result.success,
          ...(result.success ? { processId: result.processId } : { error: safeError(result.error, token, 'Ошибка запуска') }) });
      } catch (error) {
        results.push({ tokenId, success: false, error: safeError(error, token, 'Ошибка запуска') });
      }
      attempted++;
      // Параллельные завершения не меняют порядок итогов и не раскрывают секреты.
      results.sort((left, right) => order.get(left.tokenId)! - order.get(right.tokenId)!);
      report('starting');
    });
    report('completed');
    const restarted = results.filter(item => item.success).length;
    return { ok: true, restarted, failed: results.length - restarted, results };
  } finally { release(); }
}
