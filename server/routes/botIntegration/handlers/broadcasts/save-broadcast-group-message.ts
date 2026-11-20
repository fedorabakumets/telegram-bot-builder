/**
 * @fileoverview Запись истории успешно доставленного группового сообщения рассылки.
 */
import { saveBroadcastHistory } from "./save-broadcast-history";

/**
 * Сохраняет историю и уведомляет групповой диалог после успешной доставки.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор бота; отсутствие передаётся как undefined.
 * @param broadcastId - Идентификатор рассылки.
 * @param groupId - Идентификатор группового чата.
 * @param messageText - Доставленный текст.
 * @param rawButtons - Кнопки сообщения.
 * @param telegramMessageId - Идентификатор доставленного сообщения Telegram.
 * @param buttonsPerRow - Число кнопок в строке клавиатуры.
 * @param media - Первое отправленное вложение для отображения истории и редактирования подписи.
 * @returns Завершение записи истории и публикации события.
 */
export async function saveBroadcastGroupMessage(
  projectId: number, tokenId: number | null, broadcastId: number,
  groupId: string, messageText: string, rawButtons: unknown[],
  telegramMessageId?: number, buttonsPerRow = 0,
  media?: { /** Адрес отправленного файла. */ url: string; /** Тип отправленного файла. */ type: string },
): Promise<void> {
  // Записываем сообщение в историю группового диалога
  await saveBroadcastHistory({
    projectId,
    tokenId: tokenId ?? undefined,
    userId: groupId,
    chatId: groupId,
    telegramMessageId: telegramMessageId ?? null,
    messageType: "bot",
    messageText: messageText,
    messageData: {
      sentFromBroadcast: true,
      broadcastId,
      buttonsPerRow,
      ...(media ? { broadcastMediaUrl: media.url, broadcastMediaType: media.type } : {}),
      chatId: groupId,
      // Инлайн-кнопки для отображения в истории группового диалога
      ...(rawButtons.length > 0 ? { buttons: rawButtons } : {}),
    },
  });
}
