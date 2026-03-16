/**
 * @fileoverview Утилита отправки сообщений в Telegram
 *
 * Отправляет сообщения с поддержкой медиа и кнопок.
 */

import type { SendMediaFile } from "./extract-media";
import type { InlineButton } from "./extract-buttons";
import { getTelegramProxyAgent } from "../../../../utils/telegram-proxy";

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
  const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
  const startTime = Date.now();
  const proxyAgent = getTelegramProxyAgent();
  const fetchOptions = proxyAgent ? { agent: proxyAgent } : {};
  
  console.log(`[Telegram API] Sending message to chat ${chatId}, token: ${maskedToken}`);
  if (proxyAgent) {
    console.log(`[Telegram API] Using proxy agent`);
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: useHtml ? 'HTML' : undefined,
        reply_markup: replyMarkup,
      }),
      ...fetchOptions
    });
    
    console.log(`[Telegram API] Message sent in ${Date.now() - startTime}ms, status: ${response.status}`);
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = error instanceof Error && 'cause' in error 
      ? (error.cause as Error)?.message || error.cause 
      : 'No cause';
    
    console.error(`[Telegram API] Failed to send message to chat ${chatId}:`);
    console.error(`  - Error: ${errorMessage}`);
    console.error(`  - Cause: ${errorCause}`);
    console.error(`  - Time: ${Date.now() - startTime}ms`);
    throw error;
  }
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
  const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
  const endpoints: Record<string, string> = {
    photo: 'sendPhoto',
    video: 'sendVideo',
    audio: 'sendAudio',
    document: 'sendDocument',
  };

  const endpoint = endpoints[media.type] || 'sendMessage';
  const startTime = Date.now();
  const proxyAgent = getTelegramProxyAgent();
  const fetchOptions = proxyAgent ? { agent: proxyAgent } : {};
  
  console.log(`[Telegram API] Sending ${media.type} to chat ${chatId}, token: ${maskedToken}`);
  if (proxyAgent) {
    console.log(`[Telegram API] Using proxy agent`);
  }
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    [media.type]: media.url,
    caption: caption.trim(),
    parse_mode: useHtml ? 'HTML' : undefined,
    reply_markup: replyMarkup,
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify(body),
      ...fetchOptions
    });
    
    console.log(`[Telegram API] Media sent in ${Date.now() - startTime}ms, status: ${response.status}`);
    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = error instanceof Error && 'cause' in error 
      ? (error.cause as Error)?.message || error.cause 
      : 'No cause';
    
    console.error(`[Telegram API] Failed to send ${media.type} to chat ${chatId}:`);
    console.error(`  - Error: ${errorMessage}`);
    console.error(`  - Cause: ${errorCause}`);
    console.error(`  - Time: ${Date.now() - startTime}ms`);
    throw error;
  }
}
