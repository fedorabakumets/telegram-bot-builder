/**
 * @fileoverview Утилита отправки сообщений в Telegram
 * Отправляет сообщения с поддержкой медиа (локальные файлы и URL) и кнопок.
 * Возвращает типизированный результат с message_id для сохранения в БД.
 */

import { existsSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import type { SendMediaFile } from "./extract-media";
import type { InlineButton } from "./extract-buttons";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { isLocalPath, buildMultipartBody } from "./media-multipart";
import { sendTelegramMediaGroup } from "./send-telegram-media-group";

/**
 * Объект сообщения из ответа Telegram API
 */
export interface TelegramMessage {
  /** Уникальный идентификатор сообщения в чате */
  message_id: number;
  /** Дополнительные поля ответа */
  [key: string]: unknown;
}

/**
 * Результат успешного вызова Telegram Bot API
 */
export interface TelegramSendResult {
  /** Признак успешного выполнения запроса */
  ok: boolean;
  /** Объект отправленного сообщения */
  result?: TelegramMessage;
  /** Описание ошибки (при ok=false) */
  description?: string;
}

/**
 * Отправляет сообщение в Telegram с поддержкой медиа и кнопок
 * 
 * @param token - Токен бота
 * @param chatId - ID чата
 * @param text - Текст сообщения
 * @param mediaFiles - Медиафайлы
 * @param buttons - Кнопки
 * @param useHtml - Использовать HTML форматирование
 * @returns Типизированный результат Telegram API с message_id
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  mediaFiles: SendMediaFile[],
  buttons: InlineButton[],
  useHtml: boolean
): Promise<TelegramSendResult> {
  const hasMedia = mediaFiles.length > 0;
  const hasButtons = buttons.length > 0;

  // Формируем клавиатуру.
  // Telegram API требует разные поля для разных типов кнопок:
  // - url-кнопки: { text, url }
  // - web_app-кнопки: { text, web_app: { url } }
  // - copy_text-кнопки: { text, copy_text: { text } }
  // - остальные: { text, callback_data }
  const replyMarkup = hasButtons ? {
    inline_keyboard: [buttons.map(b => {
      if (b.url) return { text: b.text, url: b.url };
      if (b.webAppUrl) return { text: b.text, web_app: { url: b.webAppUrl } };
      if (b.copyText) return { text: b.text, copy_text: { text: b.copyText } };
      return { text: b.text, callback_data: b.callbackData ?? b.id };
    })]
  } : undefined;

  if (!hasMedia) {
    return sendTextMessage(token, chatId, text, useHtml, replyMarkup);
  }

  // Несколько вложений без кнопок — отправляем альбомом (sendMediaGroup),
  // т.к. альбомы Telegram не поддерживают inline-клавиатуру.
  if (mediaFiles.length > 1 && !hasButtons) {
    return sendTelegramMediaGroup(token, chatId, text, mediaFiles, useHtml);
  }

  // Отправляем первое медиа
  const firstMedia = mediaFiles[0];
  return sendMediaMessage(token, chatId, firstMedia, text, useHtml, replyMarkup);
}

/**
 * Отправляет текстовое сообщение
 * @param token - Токен бота
 * @param chatId - ID чата
 * @param text - Текст сообщения
 * @param useHtml - Использовать HTML форматирование
 * @param replyMarkup - Встроенная клавиатура
 * @returns Типизированный результат Telegram API
 */
async function sendTextMessage(
  token: string,
  chatId: string,
  text: string,
  useHtml: boolean,
  replyMarkup?: unknown
): Promise<TelegramSendResult> {
  const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
  const startTime = Date.now();
  
  console.log(`[Telegram API] Sending message to chat ${chatId}, token: ${maskedToken}`);
  
  try {
    const response = await fetchWithProxy(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        chat_id: chatId,
        text: text.trim(),
        parse_mode: useHtml ? 'HTML' : undefined,
        reply_markup: replyMarkup,
      }),
    });
    
    console.log(`[Telegram API] Message sent in ${Date.now() - startTime}ms, status: ${response.status}`);
    const json = await response.json() as TelegramSendResult;
    if (!response.ok) {
      // Бросаем ошибку с телом ответа чтобы вызывающий код мог обработать errorCode
      throw Object.assign(new Error(json.description ?? `Telegram API error ${response.status}`), json);
    }
    return json;
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
 * Отправляет медиа сообщение.
 * Локальные файлы (/uploads/...) загружаются через multipart/form-data.
 * Внешние URL и file_id передаются как строка в JSON.
 * @param token - Токен бота
 * @param chatId - ID чата
 * @param media - Медиафайл
 * @param caption - Подпись к медиа
 * @param useHtml - Использовать HTML форматирование
 * @param replyMarkup - Клавиатура
 * @returns Типизированный результат Telegram API
 */
async function sendMediaMessage(
  token: string,
  chatId: string,
  media: SendMediaFile,
  caption: string,
  useHtml: boolean,
  replyMarkup?: unknown
): Promise<TelegramSendResult> {
  const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
  const endpoints: Record<string, string> = {
    photo: 'sendPhoto',
    video: 'sendVideo',
    audio: 'sendAudio',
    document: 'sendDocument',
  };

  const endpoint = endpoints[media.type] || 'sendDocument';
  const startTime = Date.now();

  console.log(`[Telegram API] Sending ${media.type} to chat ${chatId}, token: ${maskedToken}`);

  try {
    let response: Response;

    if (isLocalPath(media.url)) {
      // Локальный файл — читаем с диска и отправляем через multipart/form-data
      const absolutePath = join(process.cwd(), media.url.startsWith('/') ? media.url.slice(1) : media.url);

      if (!existsSync(absolutePath)) {
        throw new Error(`Файл не найден на диске: ${absolutePath}`);
      }

      const fileBuffer = readFileSync(absolutePath);
      const fileName = basename(absolutePath);

      const fields: Record<string, string | undefined> = {
        chat_id: chatId,
        caption: caption.trim() || undefined,
        parse_mode: useHtml ? 'HTML' : undefined,
        reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : undefined,
      };

      const { body, boundary } = buildMultipartBody(fields, [
        { field: media.type, fileName, buffer: fileBuffer },
      ]);

      response = await fetchWithProxy(`https://api.telegram.org/bot${token}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString(),
        },
        signal: AbortSignal.timeout(30000),
        body,
      });
    } else {
      // Внешний URL или Telegram file_id — передаём как строку в JSON
      const body: Record<string, unknown> = {
        chat_id: chatId,
        [media.type]: media.url,
        caption: caption.trim(),
        parse_mode: useHtml ? 'HTML' : undefined,
        reply_markup: replyMarkup,
      };

      response = await fetchWithProxy(`https://api.telegram.org/bot${token}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify(body),
      });
    }

    console.log(`[Telegram API] Media sent in ${Date.now() - startTime}ms, status: ${response.status}`);
    const json = await response.json() as TelegramSendResult;
    if (!response.ok) {
      throw Object.assign(new Error(json.description ?? `Telegram API error ${response.status}`), json);
    }
    return json;
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
