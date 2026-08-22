/**
 * @fileoverview Планирование автоперезапуска бота после неожиданного выхода из WorkerPool.
 * @module server/bots/scheduleBotRestart
 */

import { storage } from '../storages/storage';
import { clearBotRedisLock } from './clearBotRedisLock';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import {
  getRestartDelay,
  incrementRestartCounter,
  getRestartCounter,
} from './botRestartManager';
import { startBot } from './startBot';

/**
 * Если токен с autoRestart=1 и выход неожиданный — ставит backoff и вызывает startBot.
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param reason - Краткая причина для лога (например exitStatus)
 */
export async function scheduleBotRestart(
  projectId: number,
  tokenId: number,
  reason: string,
): Promise<void> {
  if ((globalThis as { __dbPoolActive?: boolean }).__dbPoolActive === false) {
    console.log(
      `[AutoRestart] Пропуск (пул БД закрыт) project=${projectId} token=${tokenId}`,
    );
    return;
  }

  try {
    const tokenRecord = await storage.getBotToken(tokenId);
    if (!tokenRecord || tokenRecord.autoRestart !== 1) {
      console.log(
        `[AutoRestart] Пропуск token=${tokenId}: autoRestart выключен`,
      );
      return;
    }

    const inactiveError = refuseInactiveBotStart(tokenRecord.isActive);
    if (inactiveError) {
      console.log(
        `[AutoRestart] Пропуск token=${tokenId}: ${inactiveError}`,
      );
      return;
    }

    const maxAttempts = tokenRecord.maxRestartAttempts ?? 3;
    const delay = getRestartDelay(tokenId, maxAttempts);
    if (delay === null) {
      console.log(
        `[AutoRestart] Исчерпан лимит (${maxAttempts}) token=${tokenId} reason=${reason}`,
      );
      const instance = await storage.getBotInstanceByToken(tokenId);
      if (instance && instance.errorMessage !== '__server_restart__') {
        await storage.updateBotInstance(instance.id, {
          status: 'error',
          errorMessage: `Автоперезапуск исчерпан (${maxAttempts} попыток)`,
        });
      }
      return;
    }

    incrementRestartCounter(tokenId);
    const attempt = getRestartCounter(tokenId)?.attempts ?? 1;
    console.log(
      `[AutoRestart] unexpected worker death project=${projectId} token=${tokenId} ` +
        `reason=${reason} → restart in ${delay / 1000}s (attempt ${attempt}/${maxAttempts})`,
    );

    setTimeout(() => {
      void (async () => {
        try {
          const current = await storage.getBotInstanceByToken(tokenId);
          if (current?.status === 'running') {
            console.log(
              `[AutoRestart] Уже running token=${tokenId} — пропуск`,
            );
            return;
          }

          const fresh = await storage.getBotToken(tokenId);
          if (!fresh?.token || fresh.autoRestart !== 1) {
            console.log(
              `[AutoRestart] Токен недоступен / autoRestart выкл token=${tokenId}`,
            );
            return;
          }

          await clearBotRedisLock(fresh.token, tokenId);
          const result = await startBot(projectId, fresh.token, tokenId, {
            clearLogs: false,
          });
          if (!result.success) {
            console.error(
              `[AutoRestart] Не удалось поднять token=${tokenId}: ${result.error}`,
            );
          }
        } catch (err) {
          console.error(`[AutoRestart] Ошибка рестарта token=${tokenId}:`, err);
        }
      })();
    }, delay);
  } catch (err) {
    console.error(`[AutoRestart] Ошибка планирования token=${tokenId}:`, err);
  }
}
