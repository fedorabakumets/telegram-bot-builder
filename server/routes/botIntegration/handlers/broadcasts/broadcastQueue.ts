/**
 * @fileoverview Очередь отправки рассылок с throttle 25 msg/sec и обработкой ошибок Telegram
 * @module botIntegration/handlers/broadcasts/broadcastQueue
 */

import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { replaceVariablesInText } from "../messages/replace-variables";
import { sendTelegramMessage } from "../messages/send-telegram-message";
import type { SendMediaFile } from "../messages/extract-media";
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
 * Отправляет одно сообщение пользователю через общий sendTelegramMessage.
 * Проверяет поле ok в ответе Telegram и возвращает структурированный результат.
 * @param token - Токен бота
 * @param userId - Telegram user_id получателя
 * @param text - Текст сообщения (HTML)
 * @param mediaFiles - Медиафайлы для отправки
 * @returns Объект с результатом: ok, retryAfter (при 429), errorCode
 */
async function sendBroadcastMessage(
  token: string,
  userId: string,
  text: string,
  mediaFiles: SendMediaFile[],
): Promise<{ ok: boolean; retryAfter?: number; errorCode?: number; description?: string }> {
  try {
    const result = await sendTelegramMessage(token, userId, text, mediaFiles, [], true) as {
      ok?: boolean;
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

    return { ok: true };
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
 * Преобразует массив URL медиафайлов в формат SendMediaFile для sendTelegramMessage.
 * Поддерживает три формата:
 * - обычный URL (/uploads/...) — тип определяется по расширению
 * - JSON file_id запись {"__type":"file_id","mediaType":"...","fileIdsByToken":{...}} — берётся первый доступный file_id
 * - прямой Telegram file_id (строка без протокола и без JSON) — передаётся как есть
 * @param mediaUrls - Массив URL медиафайлов
 * @param tokenId - ID токена бота для выбора нужного file_id из маппинга
 * @returns Массив SendMediaFile
 */
function buildMediaFiles(mediaUrls: string[], tokenId: number): SendMediaFile[] {
  const result: SendMediaFile[] = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];

    // Формат JSON file_id: {"__type":"file_id","mediaType":"photo","fileIdsByToken":{"42":"AgAC..."}}
    if (url.startsWith('{"__type":"file_id"')) {
      try {
        const parsed = JSON.parse(url) as {
          __type: string;
          mediaType?: string;
          fileIdsByToken?: Record<string, string>;
        };
        const fileIdsByToken = parsed.fileIdsByToken ?? {};
        // Сначала ищем file_id для текущего токена, затем берём первый доступный
        const fileId = fileIdsByToken[String(tokenId)]
          ?? Object.values(fileIdsByToken)[0];

        if (fileId) {
          result.push({ id: i, url: fileId, type: parsed.mediaType ?? 'photo' });
        }
      } catch {
        console.warn(`[broadcastQueue] Не удалось распарсить file_id запись: ${url.slice(0, 80)}`);
      }
      continue;
    }

    result.push({ id: i, url, type: resolveMediaType(url) });
  }

  return result;
}

/**
 * Определяет тип медиа по расширению URL
 * @param url - URL файла
 * @returns Тип медиа для Telegram API
 */
function resolveMediaType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'photo';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'document';
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
          const result = await sendBroadcastMessage(token, user.userId, text, mediaFiles);

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
              messageData: {
                sentFromBroadcast: true,
                broadcastId,
                // URL и тип первого медиафайла для отображения в диалоге
                ...(mediaFiles.length > 0
                  ? { broadcastMediaUrl: mediaFiles[0].url, broadcastMediaType: mediaFiles[0].type }
                  : {}),
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
