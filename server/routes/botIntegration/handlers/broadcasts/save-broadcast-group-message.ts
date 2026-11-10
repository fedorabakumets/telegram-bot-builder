/**
 * @fileoverview Запись истории успешно доставленного группового сообщения рассылки.
 */
import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";

/**
 * Сохраняет историю и уведомляет групповой диалог после успешной доставки.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор бота.
 * @param broadcastId - Идентификатор рассылки.
 * @param groupId - Идентификатор группового чата.
 * @param messageText - Доставленный текст.
 * @param rawButtons - Кнопки сообщения.
 * @returns Завершение записи истории и публикации события.
 */
export async function saveBroadcastGroupMessage(
  projectId: number, tokenId: number | null, broadcastId: number,
  groupId: string, messageText: string, rawButtons: unknown[],
): Promise<void> {
  // Записываем сообщение в историю группового диалога
  await storage.createBotMessage({
    projectId,
    tokenId,
    userId: groupId,
    chatId: groupId,
    messageType: "bot",
    messageText: messageText,
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
      messageText: messageText,
      messageData: { sentFromBroadcast: true, broadcastId },
      nodeId: null,
      createdAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
}
