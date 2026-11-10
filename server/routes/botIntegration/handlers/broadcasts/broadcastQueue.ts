/**
 * @fileoverview Очередь отправки рассылок с ограничением скорости и обработкой ошибок Telegram
 * @module botIntegration/handlers/broadcasts/broadcastQueue
 */

import { normalizeBroadcastGroupIds, countBroadcastRecipients } from "./broadcast-recipient-total";
import { runBroadcastGroups } from "./run-broadcast-groups";
import { saveBroadcastGroupMessage } from "./save-broadcast-group-message";
import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { replaceVariablesInText } from "../messages/replace-variables";
import { pauseTelegramMessages } from "../messages/telegram-message-limiter";
import { sendTelegramMessage } from "../messages/send-telegram-message";
import { buildMediaFiles } from "../messages/build-media-files";
import { extractButtonsFromNode } from "../messages/extract-buttons";
import { parseBroadcastSendError } from "./parse-broadcast-send-error";
import { syncCampaignAggregates } from "./sync-campaign-aggregates";
import {
  markUserAfterBroadcastError,
  resolveBroadcastErrorStatus,
} from "./mark-user-delivery-status";
import { recordBroadcastUnauthorized } from "./record-broadcast-unauthorized";
import { isBotUnauthorized } from "@shared/broadcast-unauthorized";
import type { InlineButton } from "../messages/extract-buttons";
import type { SendMediaFile } from "../messages/extract-media";

/** Размер батча пользователей для обработки */
const BATCH_SIZE = 100;

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
  projectId: number,
): Promise<{ ok: boolean; messageId?: number; retryAfter?: number; errorCode?: number; description?: string }> {
  try {
    const result = await sendTelegramMessage(token, userId, text, mediaFiles, buttons, true, buttonsPerRow, projectId) as {
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
    return parseBroadcastSendError(error);
  }
}

/**
 * Отправляет WS-событие прогресса рассылки.
 * Для дочерней рассылки кампании добавляет campaignId, чтобы клиент
 * мог агрегировать прогресс «большой рассылки» в реальном времени
 * @param projectId - ID проекта
 * @param broadcastId - ID рассылки
 * @param counts - Счётчики отправки
 * @param totalCount - Всего
 * @param status - Текущий статус
 * @param campaignId - ID родительской кампании (null для одиночной рассылки)
 */
async function emitProgress(
  projectId: number,
  broadcastId: number,
  counts: {
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    blockedCount: number;
    deletedCount: number;
  },
  totalCount: number,
  status: "running" | "stopped" | "done" | "failed",
  campaignId: number | null = null,
): Promise<void> {
  await broadcastProjectEvent(projectId, {
    type: "broadcast-progress",
    projectId,
    data: {
      broadcastId,
      sentCount: counts.sentCount,
      deliveredCount: counts.deliveredCount,
      failedCount: counts.failedCount,
      blockedCount: counts.blockedCount,
      deletedCount: counts.deletedCount,
      totalCount,
      status,
      abortReason: status === "failed" ? "unauthorized" : undefined,
      ...(campaignId !== null ? { campaignId } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Запускает очередь отправки рассылки.
 * Загружает пользователей батчами, отправляет сообщения с ограничением скорости,
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
    /** ID родительской кампании — прокидывается в WS-прогресс и агрегаты */
    const campaignId = broadcast.campaignId ?? null;
    // Медиафайлы из поля mediaUrls рассылки — tokenId нужен для выбора правильного file_id
    const mediaFiles = buildMediaFiles((broadcast.mediaUrls as string[]) ?? [], tokenId);
    // Инлайн-кнопки рассылки: сырой массив из БД и преобразование в формат Telegram
    const rawButtons = (broadcast.buttons as any[]) ?? [];
    const inlineButtons = extractButtonsFromNode({ buttons: rawButtons });
    /** Кол-во кнопок в ряду (0 = все в один ряд) */
    const buttonsPerRow = (broadcast.buttonsPerRow as number) ?? 0;

    const users = await storage.getUsersForBroadcast(projectId, tokenId, filters as Parameters<typeof storage.getUsersForBroadcast>[2]);

    /** Уникальные группы включаются в общий прогресс наравне с пользователями. */
    const groupIds = normalizeBroadcastGroupIds((filters as { groupIds?: string[] })?.groupIds);
    const totalCount = countBroadcastRecipients(users.length, groupIds);
    await storage.updateBroadcast(broadcastId, { totalCount });
    const emptyCounts = {
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      blockedCount: 0,
      deletedCount: 0,
    };
    await emitProgress(projectId, broadcastId, emptyCounts, totalCount, "running", campaignId);
    await syncCampaignAggregates(campaignId);

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let blockedCount = 0;
    let deletedCount = 0;
    /** Токен бота отозван — дальше слать бессмысленно */
    let tokenInvalid = false;

    /** Текущие счётчики для WS и обновления БД */
    const snapshotCounts = () => ({
      sentCount,
      deliveredCount,
      failedCount,
      blockedCount,
      deletedCount,
    });

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

        while (retries < 3 && !sent && activeBroadcasts.get(broadcastId) !== "stopped") {
          const result = await sendBroadcastMessage(token, user.userId, text, mediaFiles, inlineButtons, buttonsPerRow, projectId);

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
          } else if (isBotUnauthorized(result.errorCode, result.description)) {
            if (tokenId != null) {
              await recordBroadcastUnauthorized(broadcastId, tokenId, result.description);
            }
            tokenInvalid = true;
            sent = true;
          } else if (result.errorCode === 429) {
            // Следующая попытка ожидает общую паузу бота в ограничителе.
            await pauseTelegramMessages(token, result.retryAfter ?? 1);
          } else {
            const status = resolveBroadcastErrorStatus(result.errorCode, result.description);
            if (status === "blocked" || status === "not_found") {
              // Заблокировал бота или аккаунт удалён — не ретраим
              sentCount++;
              if (status === "blocked") blockedCount++;
              else deletedCount++;
              await storage.createBroadcastResult({
                broadcastId,
                userId: user.userId,
                status,
                errorMessage: result.description,
              });
              await markUserAfterBroadcastError(projectId, tokenId, user.userId, status);
              sent = true;
            } else {
              retries++;
              if (retries >= 3) {
                failedCount++;
                sentCount++;
                await storage.createBroadcastResult({
                  broadcastId,
                  userId: user.userId,
                  status: "failed",
                  errorMessage: result.description,
                });
                sent = true;
              } else {
                await sleep(1000 * retries);
              }
            }
          }
        }

        if (tokenInvalid) break;

        if (sentCount % 10 === 0) {
          void emitProgress(projectId, broadcastId, snapshotCounts(), totalCount, "running", campaignId);
        }

      }

      if (tokenInvalid) break;

      // После каждого батча обновляем счётчики и отправляем WS-событие
      const isStopped = activeBroadcasts.get(broadcastId) === "stopped";
      await storage.updateBroadcast(broadcastId, snapshotCounts());
      await emitProgress(
        projectId,
        broadcastId,
        snapshotCounts(),
        totalCount,
        isStopped ? "stopped" : "running",
        campaignId,
      );
      await syncCampaignAggregates(campaignId);
    }

    // Группы используют те же общие счётчики, что и пользователи.
    if (!tokenInvalid) await runBroadcastGroups(groupIds, {
      stopped: () => activeBroadcasts.get(broadcastId) === "stopped",
      send: groupId => sendBroadcastMessage(token, groupId, messageText, mediaFiles, inlineButtons, buttonsPerRow, projectId),
      pause: seconds => pauseTelegramMessages(token, seconds),
      unauthorized: async description => {
        tokenInvalid = true;
        if (tokenId != null) await recordBroadcastUnauthorized(broadcastId, tokenId, description);
      },
      record: async (groupId, result) => {
        sentCount++;
        if (result.ok) deliveredCount++;
        else failedCount++;
        await storage.createBroadcastResult({ broadcastId, userId: groupId,
          status: result.ok ? "sent" : "failed", telegramMessageId: result.messageId ?? null,
          errorMessage: result.ok ? undefined : result.description });
      },
      history: groupId => saveBroadcastGroupMessage(projectId, tokenId, broadcastId, groupId, messageText, rawButtons),
      progress: async () => {
        await storage.updateBroadcast(broadcastId, snapshotCounts());
        await emitProgress(projectId, broadcastId, snapshotCounts(), totalCount,
          activeBroadcasts.get(broadcastId) === "stopped" ? "stopped" : "running", campaignId);
        await syncCampaignAggregates(campaignId);
      },
      log: error => console.error(`[broadcastQueue] Ошибка групповой рассылки ${broadcastId}:`, error),
    });

    // Определяем финальный статус
    const finalStatus = tokenInvalid
      ? "failed"
      : activeBroadcasts.get(broadcastId) === "stopped"
        ? "stopped"
        : "done";
    await storage.updateBroadcast(broadcastId, {
      status: finalStatus,
      finishedAt: new Date(),
      sentCount,
      deliveredCount,
      failedCount,
      blockedCount,
      deletedCount,
    });
    await emitProgress(
      projectId,
      broadcastId,
      { sentCount, deliveredCount, failedCount, blockedCount, deletedCount },
      totalCount,
      finalStatus,
      campaignId,
    );
    await syncCampaignAggregates(campaignId);
  } catch (error) {
    console.error(`[broadcastQueue] Критическая ошибка рассылки ${broadcastId}:`, error);
    const failed = await storage.updateBroadcast(broadcastId, { status: "failed", finishedAt: new Date() });
    await syncCampaignAggregates(failed?.campaignId ?? null);
  } finally {
    activeBroadcasts.delete(broadcastId);
  }
}
