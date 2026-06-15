/**
 * @fileoverview Очередь отправки рассылок с throttle 25 msg/sec и обработкой ошибок Telegram
 * @module botIntegration/handlers/broadcasts/broadcastQueue
 */

import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { replaceVariablesInText } from "../messages/replace-variables";
import { sendTelegramMessage } from "../messages/send-telegram-message";
import { buildMediaFiles } from "../messages/build-media-files";
import { extractButtonsFromNode } from "../messages/extract-buttons";
import type { InlineButton } from "../messages/extract-buttons";
import type { SendMediaFile } from "../messages/extract-media";

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
 * Отправляет одно сообщение пользователю через общий sendTelegramMessage.
 * Проверяет поле ok в ответе Telegram и возвращает структурированный результат.
 * @param token - Токен бота
 * @param userId - Telegram user_id получателя
 * @param text - Текст сообщения (HTML)
 * @param mediaFiles - Медиафайлы для отправки
 * @param buttons - Инлайн-кнопки сообщения
 * @param buttonsPerRow - Кол-во кнопок в ряду (0 = все в один ряд)
 * @returns Объект с результатом: ok, retryAfter (при 429), errorCode
 */
async function sendBroadcastMessage(
  token: string,
  userId: string,
  text: string,
  mediaFiles: SendMediaFile[],
  buttons: InlineButton[],
  buttonsPerRow: number,
): Promise<{ ok: boolean; messageId?: number; retryAfter?: number; errorCode?: number; description?: string }> {
  try {
    const result = await sendTelegramMessage(token, userId, text, mediaFiles, buttons, true, buttonsPerRow) as {
      ok?: boolean;
      result?: { message_id?: number };
      error_code?: number;
      description?: string;
      parameters?: { retry_after?: number };
    };

    // sendTelegramMessage возвращает тело ответа Telegram как есть — проверяем поле ok
    if (result?.ok === false) {
      return {
        ok: false,
        errorCode: result.error_code,
        description: result.description,
        retryAfter: result.parameters?.retry_after,
      };
    }

    return { ok: true, messageId: result?.result?.message_id ?? undefined };
  } catch (error: unknown) {
    // Сетевая ошибка (timeout, DNS и т.д.)
    const err = error as Record<string, unknown>;
    return {
      ok: false,
      errorCode: typeof err?.error_code === "number" ? err.error_code : undefined,
      description: typeof err?.message === "string" ? err.message : "Сетевая ошибка",
    };
  }
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
 * Запускает очередь отправки рассылки.
 * Загружает пользователей батчами, отправляет сообщения с throttle 25 msg/sec,
 * поддерживает медиафайлы, обрабатывает ошибки Telegram, проверяет флаг остановки.
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
    // Медиафайлы из поля mediaUrls рассылки — tokenId нужен для выбора правильного file_id
    const mediaFiles = buildMediaFiles((broadcast.mediaUrls as string[]) ?? [], tokenId);
    // Инлайн-кнопки рассылки: сырой массив из БД и преобразование в формат Telegram
    const rawButtons = (broadcast.buttons as any[]) ?? [];
    const inlineButtons = extractButtonsFromNode({ buttons: rawButtons });
    /** Кол-во кнопок в ряду (0 = все в один ряд) */
    const buttonsPerRow = (broadcast.buttonsPerRow as number) ?? 0;

    const users = await storage.getUsersForBroadcast(projectId, tokenId, filters as Parameters<typeof storage.getUsersForBroadcast>[2]);

    await storage.updateBroadcast(broadcastId, { totalCount: users.length });

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    // Обрабатываем пользователей батчами
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      // Проверяем флаг остановки перед каждым батчем
      if (activeBroadcasts.get(broadcastId) === "stopped") break;

      const batch: any[] = users.slice(i, i + BATCH_SIZE);

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
          const result = await sendBroadcastMessage(token, user.userId, text, mediaFiles, inlineButtons, buttonsPerRow);

          if (result.ok) {
            deliveredCount++;
            sentCount++;
            await storage.createBroadcastResult({ broadcastId, userId: user.userId, status: "sent", telegramMessageId: result.messageId ?? null });
            // Записываем сообщение в историю диалога чтобы оно было видно в панели диалога
            await storage.createBotMessage({
              projectId,
              tokenId,
              userId: user.userId,
              messageType: "bot",
              messageText: text,
              messageData: {
                sentFromBroadcast: true,
                broadcastId,
                // URL и тип первого медиафайла для отображения в диалоге
                ...(mediaFiles.length > 0
                  ? { broadcastMediaUrl: mediaFiles[0].url, broadcastMediaType: mediaFiles[0].type }
                  : {}),
                // Инлайн-кнопки для отображения в истории диалога
                ...(rawButtons.length > 0 ? { buttons: rawButtons } : {}),
              },
            });
            // Публикуем WS-событие чтобы диалог и список обновились в реальном времени
            await broadcastProjectEvent(projectId, {
              type: "new-message",
              projectId,
              tokenId,
              data: {
                id: 0,
                userId: user.userId,
                messageType: "bot",
                messageText: text,
                messageData: { sentFromBroadcast: true, broadcastId },
                nodeId: null,
                createdAt: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
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
      const isLastBatch = i + BATCH_SIZE >= users.length;
      if (!isLastBatch || isStopped) {
        await emitProgress(projectId, broadcastId, sentCount, deliveredCount, failedCount, users.length, isStopped ? "stopped" : "running");
      }
    }

    // Отправка в выбранные группы (текст + медиа)
    const groupIds = (broadcast.filters as Record<string, unknown>)?.groupIds as string[] | undefined;
    if (groupIds && groupIds.length > 0 && activeBroadcasts.get(broadcastId) !== "stopped") {
      for (const groupId of groupIds) {
        try {
          const groupResult = await sendTelegramMessage(token, groupId, broadcast.messageText, mediaFiles, inlineButtons, true, buttonsPerRow) as {
            ok?: boolean;
            result?: { message_id?: number };
          };
          const groupMsgId = groupResult?.result?.message_id ?? null;
          // Сохраняем результат с telegram_message_id для возможности редактирования/удаления
          await storage.createBroadcastResult({
            broadcastId,
            userId: groupId,
            status: "sent",
            telegramMessageId: groupMsgId,
          });
          // Записываем сообщение в историю группового диалога
          await storage.createBotMessage({
            projectId,
            tokenId,
            userId: groupId,
            chatId: groupId,
            messageType: "bot",
            messageText: broadcast.messageText,
            messageData: {
              sentFromBroadcast: true,
              broadcastId,
              chatId: groupId,
              // Инлайн-кнопки для отображения в истории группового диалога
              ...(rawButtons.length > 0 ? { buttons: rawButtons } : {}),
            },
          });
          // Публикуем WS-событие чтобы диалог группы обновился
          await broadcastProjectEvent(projectId, {
            type: "new-message",
            projectId,
            tokenId,
            data: {
              id: 0,
              userId: groupId,
              chatId: groupId,
              messageType: "bot",
              messageText: broadcast.messageText,
              messageData: { sentFromBroadcast: true, broadcastId },
              nodeId: null,
              createdAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error(`[broadcastQueue] Ошибка отправки в группу ${groupId}:`, err);
        }
      }
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
