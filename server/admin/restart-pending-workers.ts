/**
 * @fileoverview Перезапуск ботов, оставшихся в воркерах прежней группировки.
 */
import { startBotAfterStop } from '../bots/startBotAfterStop';
import { stopBot } from '../bots/stopBot';
import { POST_STOP_COOLDOWN_MS, sleepMs } from '../bots/restartTiming';
import { storage } from '../storages/storage';
import { listPendingWorkerBots } from './worker-runtime-status';

/** Признак запущенного пакетного перезапуска. */
let restarting = false;

/** Проверяет, что бот всё ещё ожидает смены группировки. */
async function stillPending(tokenId: number): Promise<boolean> {
  return (await listPendingWorkerBots()).some((item) => item.tokenId === tokenId);
}

/** Перезапускает действующие боты последовательно и возвращает итог без секретов. */
export async function restartPendingWorkers(): Promise<{ restarted: number; failed: number; errors: string[] }> {
  if (restarting) throw new Error('Перезапуск уже выполняется');
  restarting = true;
  let restarted = 0;
  const errors: string[] = [];
  try {
    for (const { projectId, tokenId } of await listPendingWorkerBots()) {
      try {
        if (!await stillPending(tokenId)) continue;
        const instance = await storage.getBotInstanceByToken(tokenId);
        const token = await storage.getBotToken(tokenId);
        if (!instance || instance.desiredStatus === 'stopped' || !token || token.projectId !== projectId) continue;
        const generation = instance.desiredGeneration;
        const stop = await stopBot(projectId, tokenId);
        if (!stop.success) throw new Error(stop.error || 'Остановка не подтверждена');
        await sleepMs(POST_STOP_COOLDOWN_MS);
        const current = await storage.getBotInstanceByToken(tokenId);
        if (!current || current.desiredStatus === 'stopped' || current.desiredGeneration !== generation) {
          throw new Error('Запуск отменён новым запросом');
        }
        const started = await startBotAfterStop(projectId, token.token, tokenId);
        if (!started.success) throw new Error(started.error || 'Запуск не подтверждён');
        restarted++;
      } catch (error) {
        errors.push(`Бот ${tokenId}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
    return { restarted, failed: errors.length, errors };
  } finally {
    restarting = false;
  }
}
