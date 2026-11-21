/**
 * @fileoverview Планирование автоперезапуска бота после неожиданного выхода из WorkerPool.
 * @module server/bots/scheduleBotRestart
 */

import { storage } from '../storages/storage';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import {
  getRestartDelay,
  incrementRestartCounter,
  getRestartCounter,
} from './botRestartManager';
import { getBotStartRevision } from './botStartState';
import { automaticBotStartAllowed } from './automaticBotStartAllowed';
import { isServerShuttingDown } from './serverShutdownState';
import { hasPendingBotRestart, queueBotRestart, reserveBotRestart } from './botRestartAttempt';
import { resolveStoredBotAutoRestart } from './resolveStoredBotAutoRestart';
import { isMemoryRefusalReason } from './workerMemoryRefusal';

/** Различает восстановление инфраструктуры и повторы ошибки самого бота. */
export interface BotRestartOptions {
  /** Доверенное событие аварии общего обработчика, проверенное вызывающей стороной. */
  infrastructure?: boolean;
}

/**
 * Планирует ограниченное восстановление инфраструктуры либо включённый пользователем автоперезапуск.
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param reason - Краткая причина для лога (например exitStatus)
 * @param options - Признак доверенной инфраструктурной аварии
 */
export async function scheduleBotRestart(
  projectId: number,
  tokenId: number,
  reason: string,
  options: BotRestartOptions = {},
): Promise<void> {
  if (isServerShuttingDown() || hasPendingBotRestart(tokenId)) return;
  if ((globalThis as { __dbPoolActive?: boolean }).__dbPoolActive === false) {
    console.log(
      `[AutoRestart] Пропуск (пул БД закрыт) project=${projectId} token=${tokenId}`,
    );
    return;
  }

  try {
    const tokenRecord = await storage.getBotToken(tokenId);
    if (!tokenRecord) return;
    const { autoRestart, maxRestartAttempts: maxAttempts } = await resolveStoredBotAutoRestart(projectId, tokenRecord);
    if (!options.infrastructure && !autoRestart) {
      console.log(
        `[AutoRestart] Пропуск token=${tokenId}: autoRestart выключен`,
      );
      return;
    }
    if (!await automaticBotStartAllowed(projectId, tokenId)) return;

    const inactiveError = refuseInactiveBotStart(tokenRecord.isActive, tokenRecord.authorizationError);
    if (inactiveError) {
      console.log(
        `[AutoRestart] Пропуск token=${tokenId}: ${inactiveError}`,
      );
      return;
    }

    const requestedInstance = await storage.getBotInstanceByToken(tokenId);
    // Отказ допуска памяти запрещает даже ранее разрешённое инфраструктурное восстановление.
    if (isMemoryRefusalReason(requestedInstance?.errorMessage ?? undefined)) return;
    if (requestedInstance?.desiredStatus === 'stopped' ||
        (options.infrastructure && requestedInstance?.desiredStatus !== 'running')) return;
    const requestedGeneration = requestedInstance?.desiredGeneration;

    const delay = getRestartDelay(tokenId, maxAttempts);
    if (delay === null) {
      console.log(
        `[AutoRestart] Исчерпан лимит (${maxAttempts}) token=${tokenId} reason=${reason}`,
      );
      const instance = await storage.getBotInstanceByToken(tokenId);
      if (instance && instance.status !== 'running' && instance.desiredStatus !== 'stopped' &&
          instance.desiredGeneration === requestedGeneration && instance.errorMessage === requestedInstance?.errorMessage &&
          instance.errorMessage !== '__server_restart__' && !isServerShuttingDown()) {
        await storage.updateBotInstance(instance.id, {
          status: 'error',
          errorMessage: `Автоперезапуск исчерпан (${maxAttempts} попыток)`,
        });
      }
      return;
    }

    if (!reserveBotRestart(tokenId)) return;
    incrementRestartCounter(tokenId);
    const attempt = getRestartCounter(tokenId)?.attempts ?? 1;
    console.log(
      `[AutoRestart] unexpected worker death project=${projectId} token=${tokenId} ` +
        `reason=${reason} → restart in ${delay / 1000}s (attempt ${attempt}/${maxAttempts})`,
    );

    queueBotRestart({ projectId, tokenId, delay, generation: requestedGeneration,
      revision: getBotStartRevision(tokenId), infrastructure: options.infrastructure === true,
      retry: () => scheduleBotRestart(projectId, tokenId, reason, options) });
  } catch (err) {
    console.error(`[AutoRestart] Ошибка планирования token=${tokenId}:`, err);
  }
}
