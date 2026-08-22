/**
 * @fileoverview Обработка bot-exited из worker pool: синхронизация БД и WS
 * @description Закрывает launch history даже без in-memory launchId (fallback на DB).
 * @module server/bots/handleWorkerBotExited
 */

import { storage } from '../storages/storage';
import { broadcastProjectEvent } from '../terminal/broadcastProjectEvent';
import { getActiveLaunchId, clearActiveLaunchId } from '../terminal/activeLaunchIds';
import { clearBotRedisLockByTokenId } from './clearBotRedisLock';
import { isWorkerCleanExit } from './isWorkerCleanExit';
import { formatBotRuntimeError, formatBotRuntimeErrorShort } from './formatBotRuntimeError';
import { isBotUnauthorized } from '@shared/broadcast-unauthorized';
import { markBotTokenUnauthorized } from './mark-bot-token-unauthorized';
import { isUnexpectedBotExit } from './isUnexpectedBotExit';
import { isExpectedStop } from './expectedStops';
import { isServerShuttingDown } from './serverShutdownState';
import { scheduleBotRestart } from './scheduleBotRestart';

/**
 * Смерть всего python-процесса (exit code / signal), а не штатный bot_exited из asyncio.
 * @param exitStatus - Статус из emit
 */
function isProcessDeathExit(exitStatus: string | number): boolean {
  if (typeof exitStatus === 'number') return true;
  const s = String(exitStatus);
  if (s === 'null') return true;
  return /^\d+$/.test(s);
}

/**
 * Обновляет БД и шлёт WS после выхода бота из воркера
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param exitStatus - Статус из worker (`error` / `stopped` / код)
 * @param runtimeError - Последняя stderr-ошибка бота (опционально)
 * @param processDeathUnexpected - true если умер весь python-воркер не от killWorker
 */
export async function handleWorkerBotExited(
  projectId: number,
  tokenId: number,
  exitStatus: string | number,
  runtimeError?: string,
  processDeathUnexpected = false,
): Promise<void> {
  // Снимаем флаги синхронно ДО любых await — иначе stopBot.finally
  // успеет clearExpectedStop до проверки autoRestart
  const expectedStop = isExpectedStop(tokenId);
  const serverShuttingDown = isServerShuttingDown();
  const intentionalWorkerKill =
    isProcessDeathExit(exitStatus) && !processDeathUnexpected;

  const statusStr = String(exitStatus);
  const isError = statusStr === 'error' || !isWorkerCleanExit(exitStatus);
  const launchStatus = isError ? 'error' : 'stopped';
  const wsType = isError ? 'bot-error' : 'bot-stopped';
  const errorMessage = isError
    ? (runtimeError
      ? formatBotRuntimeError(runtimeError)
      : statusStr === 'error'
        ? 'Бот завершился с ошибкой'
        : `Бот завершился: ${statusStr}`)
    : null;

  try {
    if ((globalThis as { __dbPoolActive?: boolean }).__dbPoolActive === false) {
      console.log(`[WorkerExit] Пропуск БД (пул закрыт) project=${projectId} token=${tokenId}`);
    } else {
      const memLaunchId = getActiveLaunchId(tokenId);
      if (memLaunchId !== undefined) {
        await storage.updateLaunchHistory(memLaunchId, {
          status: launchStatus,
          stoppedAt: new Date(),
          errorMessage,
        });
      }
      // Закрываем все оставшиеся orphans (в т.ч. если mem launchId пуст)
      await storage.closeAllRunningLaunchHistory(tokenId, {
        status: launchStatus,
        stoppedAt: new Date(),
        errorMessage,
      });
      clearActiveLaunchId(tokenId);

      const instance = await storage.getBotInstanceByToken(tokenId);
      if (instance && instance.errorMessage !== '__server_restart__') {
        await storage.updateBotInstance(instance.id, {
          status: 'stopped',
          stoppedAt: new Date(),
          errorMessage,
        });
      }

      if (isBotUnauthorized(undefined, runtimeError)) {
        await markBotTokenUnauthorized(projectId, tokenId);
      }

      await clearBotRedisLockByTokenId((id) => storage.getBotToken(id), tokenId);
    }
  } catch (err) {
    console.error(`[WorkerExit] Ошибка обновления БД project=${projectId} token=${tokenId}:`, err);
  }

  void broadcastProjectEvent(projectId, {
    type: wsType,
    projectId,
    tokenId,
    timestamp: new Date().toISOString(),
    data: { exitStatus: statusStr },
  });

  console.log(
    `[WorkerExit] project=${projectId} token=${tokenId} status=${statusStr} → WS ${wsType}${
      isError && runtimeError ? ` (${formatBotRuntimeErrorShort(runtimeError)})` : ''
    }`,
  );

  if (
    isUnexpectedBotExit({
      tokenId,
      exitStatus,
      intentionalWorkerKill,
      serverShuttingDown,
      expectedStop,
    })
  ) {
    await scheduleBotRestart(projectId, tokenId, statusStr);
  }
}
