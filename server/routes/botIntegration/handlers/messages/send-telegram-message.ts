/**
 * @fileoverview Утилита отправки сообщений в Telegram
 * 
 * Отправляет сообщения с поддержкой медиа и кнопок.
 */

import type { SendMediaFile } from "./extract-media";
import type { InlineButton } from "./extract-buttons";

/**
 * Отправляет сообщение в Telegram с поддержкой медиа и кнопок
 * 
 * @param token - Токен бота
 * @param chatId - ID чата
 * @param text - Текст сообщения
 * @param mediaFiles - Медиафайлы
 * @param buttons - Кнопки
 * @param useHtml - Использовать HTML форматирование
 * @returns Результат отправки
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  mediaFiles: SendMediaFile[],
  buttons: InlineButton[],
  useHtml: boolean
): Promise<unknown> {
  const hasMedia = mediaFiles.length > 0;
  const hasButtons = buttons.length > 0;

  // Формируем клавиатуру
  const replyMarkup = hasButtons ? {
    inline_keyboard: [buttons.map(b => ({
      text: b.text,
      callback_data: b.callbackData || b.url,
    }))]
  } : undefined;

  if (!hasMedia) {
    return sendTextMessage(token, chatId, text, useHtml, replyMarkup);
  }

  // Отправляем первое медиа
  const firstMedia = mediaFiles[0];
  return sendMediaMessage(token, chatId, firstMedia, text, useHtml, replyMarkup);
}

/**
 * Отправляет текстовое сообщение
 */
async function sendTextMessage(
  token: string,
  chatId: string,
  text: string,
  useHtml: boolean,
  replyMarkup?: unknown
): Promise<unknown> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.trim(),
      parse_mode: useHtml ? 'HTML' : undefined,
      reply_markup: replyMarkup,
    }),
  });
  return await response.json();
}

/**
 * Отправляет медиа сообщение
 */
async function sendMediaMessage(
  token: string,
  chatId: string,
  media: SendMediaFile,
  caption: string,
  useHtml: boolean,
  replyMarkup?: unknown
): Promise<unknown> {
  const endpoints: Record<string, string> = {
    photo: 'sendPhoto',
    video: 'sendVideo',
    audio: 'sendAudio',
    document: 'sendDocument',
  };

  const endpoint = endpoints[media.type] || 'sendMessage';
  const body: Record<string, unknown> = {
    chat_id: chatId,
    [media.type]: media.url,
    caption: caption.trim(),
    parse_mode: useHtml ? 'HTML' : undefined,
    reply_markup: replyMarkup,
  };

  const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await response.json();
}
