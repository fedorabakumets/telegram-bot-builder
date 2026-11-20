/**
 * @fileoverview Проверка пакета вложений до отправки без потери файлов.
 */
import type { SendMediaFile } from './extract-media';

/** Поддерживаемые Telegram типы вложений альбома. */
const ALBUM_TYPES = new Set(['photo', 'video', 'audio', 'document']);

/**
 * Отклоняет пакет, который нельзя целиком отправить одним сообщением или альбомом.
 * @param mediaFiles - Все выбранные вложения
 * @param hasButtons - Наличие встроенной клавиатуры
 * @returns Ничего, если пакет поддерживается
 */
export function validateTelegramMediaPackage(mediaFiles: SendMediaFile[], hasButtons = false): void {
  if (mediaFiles.length < 2) return;
  if (hasButtons) {
    throw new Error('Telegram не поддерживает кнопки у альбома. Оставьте одно вложение или уберите кнопки. Ничего не отправлено.');
  }
  if (mediaFiles.length > 10) {
    throw new Error('В одном альбоме Telegram допускается не более 10 вложений. Ничего не отправлено.');
  }
  if (mediaFiles.some(media => !ALBUM_TYPES.has(media.type))) {
    throw new Error('Альбом Telegram поддерживает только фото, видео, аудио и документы. Ничего не отправлено.');
  }
  const types = new Set(mediaFiles.map(media => media.type));
  if ((types.has('audio') || types.has('document')) && types.size > 1) {
    throw new Error('Аудио и документы можно объединять только в альбомы одного типа. Ничего не отправлено.');
  }
}
