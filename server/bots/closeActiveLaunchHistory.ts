/**
 * @fileoverview Закрытие активной записи истории запуска перед новым стартом бота
 * @module server/bots/closeActiveLaunchHistory
 */

import { storage } from '../storages/storage';
import { clearActiveLaunchId } from '../terminal/activeLaunchIds';

/**
 * Закрывает незавершённый запуск в bot_launch_history и сбрасывает in-memory launchId
 * @param tokenId - Идентификатор токена бота
 */
export async function closeActiveLaunchHistory(tokenId: number): Promise<void> {
  const activeHistory = await storage.getActiveLaunchHistory(tokenId);
  if (activeHistory) {
    await storage.updateLaunchHistory(activeHistory.id, {
      status: 'stopped',
      stoppedAt: new Date(),
      errorMessage: null,
    });
  }
  clearActiveLaunchId(tokenId);
}
