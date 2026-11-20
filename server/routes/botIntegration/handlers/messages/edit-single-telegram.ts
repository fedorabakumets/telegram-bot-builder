/** @fileoverview Вызов Telegram при редактировании одного сообщения. */
import { getTelegramApiBaseUrl } from "../../../../utils/telegram-api-url";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Проверяет наличие медиа-вложения в данных сообщения
 * @param messageData - Данные сообщения из БД
 * @returns true для медиа с подписью, включая сохранённые данные рассылки.
 */
export function hasMediaAttachment(messageData: unknown): boolean {
  if (!messageData || typeof messageData !== "object") return false;
  const data = messageData as Record<string, unknown>;
  const mediaType = data.mediaType ?? data.broadcastMediaType;
  if (mediaType === 'sticker' || data.sticker) return false;
  const storedMedia = typeof data.mediaUrl === 'string' && data.mediaUrl.length > 0
    || typeof data.broadcastMediaUrl === 'string' && data.broadcastMediaUrl.length > 0
    || Array.isArray(data.mediaUrls) && data.mediaUrls.some(value => typeof value === 'string' && value.length > 0);
  const captionTypes = ["photo", "video", "audio", "voice", "document", "animation"];
  return captionTypes.includes(String(mediaType)) || Boolean(storedMedia) || captionTypes.some(
    (type) => data[type] && typeof (data[type] as Record<string, unknown>)?.file_id === "string"
  );
}

/**
 * Вызывает Telegram API для редактирования текста или подписи к медиа
 * @param token - Токен бота
 * @param chatId - ID чата (userId в Telegram)
 * @param telegramMessageId - ID сообщения в Telegram
 * @param messageText - Новый текст сообщения
 * @param isMedia - Редактировать подпись (caption) или текст
 * @param replyMarkup - Встроенная клавиатура (inline_keyboard); пустой массив убирает кнопки
 * @returns Успех операции и возможная ошибка
 */
export async function callTelegramEditMessage(
  token: string,
  chatId: string,
  telegramMessageId: number,
  messageText: string,
  isMedia: boolean,
  replyMarkup: { inline_keyboard: any[][] }
): Promise<{ success: boolean; error?: string }> {
  const method = isMedia ? "editMessageCaption" : "editMessageText";
  const textField = isMedia ? "caption" : "text";
  const url = `${getTelegramApiBaseUrl()}/bot${token}/${method}`;

  const response = await fetchWithProxy(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: telegramMessageId,
      [textField]: messageText,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });

  const result = await response.json() as { ok?: boolean; description?: string };
  /** Telegram считает повтор идентичной правки ошибкой, но требуемое состояние уже достигнуто. */
  if (/message is not modified/i.test(result.description ?? '')) return { success: true };
  if (!response.ok || result.ok !== true) {
    return { success: false, error: result.description ?? "Неизвестная ошибка" };
  }

  return { success: true };
}
