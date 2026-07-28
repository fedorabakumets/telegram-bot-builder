/**
 * @fileoverview Сверка bot_launch_history с live-статусом процесса
 * @module server/bots/reconcileLaunchHistory
 */

import { storage } from '../storages/storage';
import { clearActiveLaunchId } from '../terminal/activeLaunchIds';
import { closeActiveLaunchHistory } from './closeActiveLaunchHistory';

/** Сообщение по умолчанию при закрытии сиротских running-записей */
const DEFAULT_RECONCILE_MSG = 'Синхронизация: процесс не найден';

/**
 * Если бот не live — закрывает все running-записи истории запуска токена
 * @param tokenId - ID токена
 * @param isLiveRunning - Реально ли процесс/воркер жив
 * @param errorMessage - Опциональный текст для errorMessage
 * @returns Число закрытых записей
 */
export async function reconcileLaunchHistoryForToken(
  tokenId: number,
  isLiveRunning: boolean,
  errorMessage: string | null = DEFAULT_RECONCILE_MSG,
): Promise<number> {
  if (isLiveRunning) {
    return 0;
  }
  const closed = await storage.closeAllRunningLaunchHistory(tokenId, {
    status: 'stopped',
    stoppedAt: new Date(),
    errorMessage,
  });
  if (closed > 0) {
    clearActiveLaunchId(tokenId);
  }
  return closed;
}

/**
 * Startup sweep: закрыть orphans у токенов без live instance/worker
 * @param isTokenLive - Колбэк: жив ли бот для tokenId
 * @returns Суммарно закрытых записей
 */
export async function reconcileOrphanLaunchHistories(
  isTokenLive: (tokenId: number) => boolean | Promise<boolean>,
): Promise<number> {
  const tokenIds = await storage.listTokenIdsWithRunningLaunchHistory();
  let total = 0;
  for (const tokenId of tokenIds) {
    const live = await isTokenLive(tokenId);
    if (!live) {
      total += await reconcileLaunchHistoryForToken(tokenId, false);
    }
  }
  return total;
}

/**
 * Закрыть все open launches токена (alias для shutdown/cleanup)
 * @param tokenId - ID токена
 */
export async function forceCloseLaunchHistory(tokenId: number): Promise<void> {
  await closeActiveLaunchHistory(tokenId);
}
