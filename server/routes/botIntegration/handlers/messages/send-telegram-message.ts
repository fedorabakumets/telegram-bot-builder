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

/** MIME-типы по расширению файла */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  pdf: 'application/pdf', zip: 'application/zip',
};

/**
 * Определяет MIME-тип по имени файла
 * @param fileName - Имя файла
 * @returns MIME-тип
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Проверяет является ли URL локальным путём к файлу на сервере
 * @param url - URL или путь
 * @returns true если это локальный путь
 */
function isLocalPath(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('uploads/');
}

/**
 * Строит multipart/form-data тело запроса для отправки файла в Telegram
 * @param fields - Текстовые поля формы
 * @param fileField - Имя поля файла
 * @param fileName - Имя файла
 * @param fileBuffer - Содержимое файла
 * @returns Объект с body и boundary
 */
function buildMultipartBody(
  fields: Record<string, string | undefined>,
  fileField: string,
  fileName: string,
  fileBuffer: Buffer,
): { body: Buffer; boundary: string } {
  const boundary = `----TelegramBotBoundary${Date.now()}`;
  const CRLF = '\r\n';
  const parts: Buffer[] = [];

  // Текстовые поля
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    parts.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }

  // Файл
  const mimeType = getMimeType(fileName);
  parts.push(Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="${fileField}"; filename="${fileName}"${CRLF}` +
    `Content-Type: ${mimeType}${CRLF}${CRLF}`
  ));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));

  return { body: Buffer.concat(parts), boundary };
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
  // - остальные: { text, callback_data }
  const replyMarkup = hasButtons ? {
    inline_keyboard: [buttons.map(b => {
      if (b.url) return { text: b.text, url: b.url };
      if (b.webAppUrl) return { text: b.text, web_app: { url: b.webAppUrl } };
      return { text: b.text, callback_data: b.callbackData ?? b.id };
    })]
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

      const { body, boundary } = buildMultipartBody(fields, media.type, fileName, fileBuffer);

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
