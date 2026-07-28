/**
 * @fileoverview Перезапуск бота при обновлении кода проекта
 * @module server/bots/restartBotIfRunning
 */

import { botProcesses } from "../routes/routes";
import { storage } from "../storages/storage";
import { findActiveProcessForProject } from "../utils/findActiveProcessForProject";
import { startBot } from "./startBot";
import { stopBot } from "./stopBot";

/**
 * Перезапускает Telegram-бота, если он запущен (после обновления кода).
 * В worker-режиме вызывает полный stopBot (закрывает launch history), затем startBot.
 * @param projectId - ID проекта
 * @returns Результат операции
 */
export async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string; }> {
  try {
    const instance = await storage.getBotInstance(projectId);

    if (!instance || instance.status !== 'running') {
      return { success: true };
    }

    console.log(`Перезапускаем бота ${projectId} из-за обновления кода...`);

    if (process.env.USE_WORKER_POOL !== 'false') {
      await stopBot(projectId, instance.tokenId);
      await new Promise(resolve => setTimeout(resolve, 500));
      return await startBot(projectId, instance.token, instance.tokenId);
    }

    const stopResult = await stopBot(projectId, instance.tokenId);
    if (!stopResult.success) {
      console.error(`Ошибка перезапуска бота ${projectId}:`, stopResult.error);
      return { success: true };
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const activeProcessInfo = findActiveProcessForProject(projectId);
    if (activeProcessInfo) {
      console.log(`Процесс бота ${projectId} еще не завершен, принудительно удаляем из памяти`);
      botProcesses.delete(activeProcessInfo.processKey);
    }

    return await startBot(projectId, instance.token, instance.tokenId);
  } catch (error) {
    console.error('Ошибка перезапуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
