/**
 * @fileoverview Построение массива медиафайлов для отправки в Telegram
 *
 * Преобразует массив URL медиафайлов в формат SendMediaFile.
 * Используется хендлером отправки сообщений, очередью рассылок и групповой отправкой.
 *
 * @module botIntegration/handlers/messages/build-media-files
 */

import { telegramFileReferenceSchema } from "../../../../../shared/schema/media-reference-contracts";
import type { SendMediaFile } from "./extract-media";

/**
 * Определяет тип медиа по расширению URL
 * @param url - URL файла
 * @returns Тип медиа для Telegram API: photo, video, audio или document
 */
export function resolveMediaType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'photo';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'document';
}

/**
 * Преобразует массив URL медиафайлов в формат SendMediaFile.
 * Поддерживает JSON file_id записи вида {"__type":"file_id","mediaType":"photo","fileIdsByToken":{"42":"AgAC..."}}.
 * Для записей file_id выбирается значение по tokenId, иначе берётся первый доступный file_id.
 * @param mediaUrls - Массив URL медиафайлов
 * @param tokenId - ID токена для выбора нужного file_id из маппинга
 * @returns Массив SendMediaFile для sendTelegramMessage
 */
export function buildMediaFiles(mediaUrls: string[], tokenId: number): SendMediaFile[] {
  const result: SendMediaFile[] = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];

    // Формат JSON file_id
    if (url.trimStart().startsWith('{')) {
      try {
        const parsed = telegramFileReferenceSchema.parse(JSON.parse(url));
        const fileId = parsed.fileIdsByToken[String(tokenId)];
        if (!fileId) throw new Error('Нет file_id выбранного бота');
        if (fileId) {
          result.push({ id: i, url: fileId, type: parsed.mediaType ?? 'photo' });
        }
      } catch {
        throw new Error("Недопустимая запись Telegram file_id");
      }
      continue;
    }

    result.push({ id: i, url, type: resolveMediaType(url) });
  }

  return result;
}
