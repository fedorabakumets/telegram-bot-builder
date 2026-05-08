/**
 * @fileoverview Очередь отправки рассылок с throttle 25 msg/sec и обработкой ошибок Telegram
 * @module botIntegration/handlers/broadcasts/broadcastQueue
 */

import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { replaceVariablesInText } from "../messages/replace-variables";
import type { UserBotData } from "@shared/schema";

/** Размер батча пользователей для обработки */
const BATCH_SIZE = 100;

/** Максимальное количество сообщений в секунду */
const MESSAGES_PER_SECOND = 25;

/** Пауза между сообщениями в батче (мс) */
const DELAY_BETWEEN_MESSAGES = Math.floor(1000 / MESSAGES_PER_SECOND);

/**
 * Карта активных рассылок: broadcastId → статус ('running' | 'stopped')
 * Используется для проверки флага остановки из stopBroadcastHandler
 */
export const activeBroadcasts = new Map<number, "running" | "stopped">();

/**
 * Задержка выполнения на указанное количество миллисекунд
 * @param ms - Количество миллисекунд
 * @returns Promise, который разрешается через ms миллисекунд
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Отправляет одно сообщение пользователю через Telegram Bot API
 * @param token - Токен бота
 * @param userId - Telegram user_id получателя
 * @param text - Текст сообщения (HTML)
 * @returns Объект с результатом: ok, retryAfter (при 429), errorCode
 */
async function sendTelegramMessage(
  token: string,
  userId: string,
  text: string,
): Promise<{ ok: boolean; retryAfter?: number; errorCode?: number; description?: string }> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: userId, text, parse_mode: "HTML" }),
  });
  const result = await response.json() as { ok: boolean; error_code?: number; description?: string; parameters?: { retry_after?: number } };

  if (response.ok) return { ok: true };

  return {
    ok: false,
    errorCode: result.error_code,
    description: result.description,
    retryAfter: result.parameters?.retry_after,
  };
}

/**
 * Определяет статус ошибки по коду ошибки Telegram
 * @param errorCode - Код ошибки Telegram
 * @param description - Описание ошибки
 * @returns Статус результата рассылки
 */
function resolveErrorStatus(errorCode?: number, description?: string): "blocked" | "not_found" | "failed" {
  if (errorCode === 403) return "blocked";
  if (errorCode === 400 && description?.includes("chat not found")) return "not_found";
  return "failed";
}

/**
 * Отправляет WS-событие прогресса рассылки
 * @param projectId - ID проекта
 * @param broadcastId - ID рассылки
 * @param sentCount - Отправлено
 * @param deliveredCount - Доставлено
 * @param failedCount - Ошибок
 * @param totalCount - Всего
 * @param status - Текущий статус
 */
async function emitProgress(
  projectId: number,
  broadcastId: number,
  sentCount: number,
  deliveredCount: number,
  failedCount: number,
  totalCount: number,
  status: "running" | "stopped" | "done",
): Promise<void> {
  await broadcastProjectEvent(projectId, {
    type: "broadcast-progress",
    projectId,
    data: { broadcastId, sentCount, deliveredCount, failedCount, totalCount, status },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Запускает очередь отправки рассылки
 * Загружает пользователей батчами, отправляет сообщения с throttle 25 msg/sec,
 * обрабатывает ошибки Telegram, проверяет флаг остановки
 * @param broadcastId - ID рассылки
 * @param token - Токен бота для отправки
 */
export async function runBroadcastQueue(broadcastId: number, token: string): Promise<void> {
  activeBroadcasts.set(broadcastId, "running");

  try {
    const broadcast = await storage.getBroadcastById(broadcastId);
    if (!broadcast) {
      console.error(`[broadcastQueue] Рассылка ${broadcastId} не найдена`);
      return;
    }

    const { projectId, tokenId, messageText, filters } = broadcast;
    const users = await storage.getUsersForBroadcast(projectId, tokenId, filters as Parameters<typeof storage.getUsersForBroadcast>[2]);

    await storage.updateBroadcast(broadcastId, { totalCount: users.length });

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    // Обрабатываем пользователей батчами
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      // Проверяем флаг остановки перед каждым батчем
      if (activeBroadcasts.get(broadcastId) === "stopped") break;

      const batch: UserBotData[] = users.slice(i, i + BATCH_SIZE);

      for (const user of batch) {
        // Проверяем флаг остановки внутри батча
        if (activeBroadcasts.get(broadcastId) === "stopped") break;

        const userData = (user.userData as Record<string, unknown>) || {};
        const telegramUser = {
          id: Number(user.userId),
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          userName: user.userName || undefined,
        };

        const text = await replaceVariablesInText({ text: messageText, userData, telegramUser, projectId });

        let retries = 0;
        let sent = false;

        while (retries < 3 && !sent) {
          const result = await sendTelegramMessage(token, user.userId, text);

          if (result.ok) {
            deliveredCount++;
            sentCount++;
            await storage.createBroadcastResult({ broadcastId, userId: user.userId, status: "sent" });
            // Записываем сообщение в историю диалога чтобы оно было видно в панели диалога
            await storage.createBotMessage({
              projectId,
              tokenId,
              userId: user.userId,
              messageType: "bot",
              messageText: text,
              messageData: { sentFromBroadcast: true, broadcastId },
            });
            sent = true;
          } else if (result.errorCode === 429 && result.retryAfter) {
            // Rate limit — ждём retry_after секунд
            await sleep(result.retryAfter * 1000);
          } else if (result.errorCode === 403 || (result.errorCode === 400 && result.description?.includes("chat not found"))) {
            // Пользователь заблокировал бота или не найден — не ретраим
            failedCount++;
            sentCount++;
            const status = resolveErrorStatus(result.errorCode, result.description);
            await storage.createBroadcastResult({ broadcastId, userId: user.userId, status, errorMessage: result.description });
            sent = true;
          } else {
            retries++;
            if (retries >= 3) {
              failedCount++;
              sentCount++;
              await storage.createBroadcastResult({ broadcastId, userId: user.userId, status: "failed", errorMessage: result.description });
              sent = true;
            } else {
              await sleep(1000 * retries);
            }
          }
        }

        await sleep(DELAY_BETWEEN_MESSAGES);
      }

      // После каждого батча обновляем счётчики и отправляем WS-событие
      const isStopped = activeBroadcasts.get(broadcastId) === "stopped";
      await storage.updateBroadcast(broadcastId, { sentCount, deliveredCount, failedCount });
      await emitProgress(projectId, broadcastId, sentCount, deliveredCount, failedCount, users.length, isStopped ? "stopped" : "running");
    }

    // Определяем финальный статус
    const finalStatus = activeBroadcasts.get(broadcastId) === "stopped" ? "stopped" : "done";
    await storage.updateBroadcast(broadcastId, { status: finalStatus, finishedAt: new Date(), sentCount, deliveredCount, failedCount });
    await emitProgress(projectId, broadcastId, sentCount, deliveredCount, failedCount, users.length, finalStatus);
  } catch (error) {
    console.error(`[broadcastQueue] Критическая ошибка рассылки ${broadcastId}:`, error);
    await storage.updateBroadcast(broadcastId, { status: "failed", finishedAt: new Date() });
  } finally {
    activeBroadcasts.delete(broadcastId);
  }
}
