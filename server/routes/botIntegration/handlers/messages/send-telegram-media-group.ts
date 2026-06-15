/**
 * @fileoverview Утилита отправки нескольких вложений альбомом в Telegram
 * Использует метод sendMediaGroup. Поддерживает локальные файлы (multipart),
 * внешние URL и file_id. Пограничные случаи (0/1 элемент) делегируются
 * одиночной отправке через sendTelegramMessage.
 */

import { existsSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import type { SendMediaFile } from "./extract-media";
import type { TelegramSendResult, TelegramMessage } from "./send-telegram-message";
import { sendTelegramMessage } from "./send-telegram-message";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { isLocalPath, buildMultipartBody, type MultipartFile } from "./media-multipart";

/** Типы медиа, которые Telegram допускает в альбоме */
const ALBUM_TYPES = new Set(['photo', 'video', 'audio', 'document']);

/** Максимальное число элементов в альбоме Telegram */
const MAX_ALBUM_SIZE = 10;

/**
 * Описание одного элемента поля media запроса sendMediaGroup
 */
interface MediaGroupItem {
  /** Тип элемента: photo, video, audio или document */
  type: string;
  /** Ссылка на медиа: URL, file_id или attach://fileN */
  media: string;
  /** Подпись (только у первого элемента) */
  caption?: string;
  /** Режим форматирования подписи */
  parse_mode?: string;
}

/**
 * Отправляет несколько вложений одним альбомом (sendMediaGroup).
 * @param token - Токен бота
 * @param chatId - ID чата
 * @param caption - Подпись (ставится только первому элементу)
 * @param mediaFiles - Медиафайлы
 * @param useHtml - Использовать HTML форматирование подписи
 * @returns Типизированный результат Telegram API (первое сообщение альбома)
 */
export async function sendTelegramMediaGroup(
  token: string,
  chatId: string,
  caption: string,
  mediaFiles: SendMediaFile[],
  useHtml: boolean
): Promise<TelegramSendResult> {
  // Отфильтровываем неподдерживаемые в альбоме типы (sticker/voice и пр.)
  const supported = mediaFiles.filter((m) => ALBUM_TYPES.has(m.type)).slice(0, MAX_ALBUM_SIZE);

  // Пограничный случай: 0 или 1 элемент — делегируем одиночной отправке
  if (supported.length < 2) {
    return sendTelegramMessage(token, chatId, caption, supported, [], useHtml);
  }

  const maskedToken = token.length > 12 ? `${token.slice(0, 8)}...${token.slice(-4)}` : '***';
  const startTime = Date.now();
  const hasLocal = supported.some((m) => isLocalPath(m.url));

  console.log(`[Telegram API] Sending media group (${supported.length}) to chat ${chatId}, token: ${maskedToken}`);

  // Собираем массив media и (при необходимости) файлы для multipart
  const media: MediaGroupItem[] = [];
  const files: MultipartFile[] = [];
  const trimmed = caption.trim();

  supported.forEach((item, idx) => {
    let mediaRef = item.url;
    if (isLocalPath(item.url)) {
      const absolutePath = join(process.cwd(), item.url.startsWith('/') ? item.url.slice(1) : item.url);
      if (!existsSync(absolutePath)) {
        throw new Error(`Файл не найден на диске: ${absolutePath}`);
      }
      const field = `file${idx}`;
      files.push({ field, fileName: basename(absolutePath), buffer: readFileSync(absolutePath) });
      mediaRef = `attach://${field}`;
    }

    const entry: MediaGroupItem = { type: item.type, media: mediaRef };
    // Подпись ставим только первому элементу
    if (idx === 0 && trimmed) {
      entry.caption = trimmed;
      if (useHtml) entry.parse_mode = 'HTML';
    }
    media.push(entry);
  });

  try {
    const url = `https://api.telegram.org/bot${token}/sendMediaGroup`;
    let response: Response;

    if (hasLocal) {
      const { body, boundary } = buildMultipartBody(
        { chat_id: chatId, media: JSON.stringify(media) },
        files,
      );
      response = await fetchWithProxy(url, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString(),
        },
        signal: AbortSignal.timeout(30000),
        body,
      });
    } else {
      response = await fetchWithProxy(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ chat_id: chatId, media }),
      });
    }

    console.log(`[Telegram API] Media group sent in ${Date.now() - startTime}ms, status: ${response.status}`);
    const json = await response.json() as { ok: boolean; result?: TelegramMessage[]; description?: string };
    if (!response.ok) {
      throw Object.assign(new Error(json.description ?? `Telegram API error ${response.status}`), json);
    }
    // sendMediaGroup возвращает массив сообщений — приводим к одиночному виду
    return { ok: json.ok, result: Array.isArray(json.result) ? json.result[0] : undefined };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = error instanceof Error && 'cause' in error
      ? (error.cause as Error)?.message || error.cause
      : 'No cause';

    console.error(`[Telegram API] Failed to send media group to chat ${chatId}:`);
    console.error(`  - Error: ${errorMessage}`);
    console.error(`  - Cause: ${errorCause}`);
    console.error(`  - Time: ${Date.now() - startTime}ms`);
    throw error;
  }
}
