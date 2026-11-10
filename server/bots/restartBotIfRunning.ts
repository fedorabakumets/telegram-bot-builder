/**
 * @fileoverview Перезапуск бота при обновлении кода проекта
 * @module server/bots/restartBotIfRunning
 */

import { botProcesses } from "../routes/routes";
import { storage } from "../storages/storage";
import { findActiveProcessForProject } from "../utils/findActiveProcessForProject";
import { startBotAfterStop } from "./startBotAfterStop";
import { isWorkerPoolEnabled } from "./isWorkerPoolEnabled";
import { stopBot } from "./stopBot";
import { POST_STOP_COOLDOWN_MS, sleepMs } from "./restartTiming";

/**
 * Перезапускает Telegram-бота, если он запущен (после обновления кода).
 * @param projectId - ID проекта
 * @returns Результат операции
 */
export async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string; }> {
  try {
    const instance = await storage.getBotInstance(projectId);

    if (!instance || instance.status !== 'running' || instance.desiredStatus === 'stopped') {
      return { success: true };
    }

    console.log(`Перезапускаем бота ${projectId} из-за обновления кода...`);

    const tokenId = instance.tokenId;
    const desiredGeneration = instance.desiredGeneration;
    if (!tokenId) {
      return { success: false, error: 'У экземпляра бота нет tokenId' };
    }
    const tokenRecord = await storage.getBotToken(tokenId);
    if (!tokenRecord?.token) {
      return { success: false, error: 'Токен бота не найден в bot_tokens' };
    }
    const launchToken = tokenRecord.token;

    if (isWorkerPoolEnabled()) {
      const stopResult = await stopBot(projectId, tokenId);
      if (!stopResult.success) {
        return { success: false, error: stopResult.error };
      }
      await sleepMs(POST_STOP_COOLDOWN_MS);
      const current = await storage.getBotInstanceByToken(tokenId);
      if (!current || current.desiredStatus === 'stopped' || current.desiredGeneration !== desiredGeneration) return { success: true };
      return await startBotAfterStop(projectId, launchToken, tokenId);
    }

    const stopResult = await stopBot(projectId, tokenId);
    if (!stopResult.success) {
      console.error(`Ошибка перезапуска бота ${projectId}:`, stopResult.error);
      return { success: true };
    }

    await sleepMs(POST_STOP_COOLDOWN_MS);
    const current = await storage.getBotInstanceByToken(tokenId);
    if (!current || current.desiredStatus === 'stopped' || current.desiredGeneration !== desiredGeneration) return { success: true };

    const activeProcessInfo = findActiveProcessForProject(projectId);
    if (activeProcessInfo) {
      console.log(`Процесс бота ${projectId} еще не завершен, принудительно удаляем из памяти`);
      botProcesses.delete(activeProcessInfo.processKey);
    }

    return await startBotAfterStop(projectId, launchToken, tokenId);
  } catch (error) {
    console.error('Ошибка перезапуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
