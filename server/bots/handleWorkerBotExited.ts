/**
 * @fileoverview Обработка bot-exited из worker pool: синхронизация БД и WS
 * @description Закрывает launch history даже без in-memory launchId (fallback на DB).
 * @module server/bots/handleWorkerBotExited
 */

import { storage } from '../storages/storage';
import { broadcastProjectEvent } from '../terminal/broadcastProjectEvent';
import { getActiveLaunchId, clearActiveLaunchId } from '../terminal/activeLaunchIds';
import { isWorkerCleanExit } from './isWorkerCleanExit';
import { formatBotRuntimeError, formatBotRuntimeErrorShort } from './formatBotRuntimeError';
import { isRuntimeTokenUnauthorized } from './is-runtime-token-unauthorized';
import { markBotTokenUnauthorized } from './mark-bot-token-unauthorized';
import { isFrozenBotError } from './frozenBotStatus';
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
 * @param observedToken - Секрет завершившегося запуска для защиты от запоздалого 401
 */
export async function handleWorkerBotExited(
  projectId: number,
  tokenId: number,
  exitStatus: string | number,
  runtimeError?: string,
  processDeathUnexpected = false,
  observedToken?: string,
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

  /** Причина отказа не должна теряться из-за независимой ошибки записи истории. */
  const unauthorized = isRuntimeTokenUnauthorized(runtimeError);
  if (observedToken && unauthorized && (globalThis as { __dbPoolActive?: boolean }).__dbPoolActive !== false) {
    try {
      await markBotTokenUnauthorized(projectId, tokenId, observedToken);
    } catch {
      console.error(`[WorkerExit] Не удалось сохранить отказ авторизации project=${projectId} token=${tokenId}`);
    }
  }

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

      // Не удаляем общий ключ: его уже мог получить другой запуск этого токена.
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
    !unauthorized && !isFrozenBotError(runtimeError) && isUnexpectedBotExit({
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
