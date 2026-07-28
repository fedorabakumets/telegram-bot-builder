/**
 * @fileoverview Закрытие активных записей истории запуска бота
 * @module server/bots/closeActiveLaunchHistory
 */

import { storage } from '../storages/storage';
import { clearActiveLaunchId } from '../terminal/activeLaunchIds';

/**
 * Закрывает ВСЕ незавершённые (running) запуски токена и сбрасывает in-memory launchId
 * @param tokenId - Идентификатор токена бота
 * @param errorMessage - Опциональное сообщение (null = чистая остановка)
 */
export async function closeActiveLaunchHistory(
  tokenId: number,
  errorMessage: string | null = null,
): Promise<void> {
  await storage.closeAllRunningLaunchHistory(tokenId, {
    status: 'stopped',
    stoppedAt: new Date(),
    errorMessage,
  });
  clearActiveLaunchId(tokenId);
}
