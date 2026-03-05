/**
 * @fileoverview Утилиты для определения MIME-типов файлов
 * @module server/telegram/utils/mime-utils
 */

import type { MimeType } from '../types/mime-type.js';
import type { ExtensionMimeMap } from '../types/extension-mime-map.js';

/**
 * Карта соответствия расширений и MIME-типов для фото
 */
const PHOTO_MIME_MAP: ExtensionMimeMap = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

/**
 * Карта соответствия расширений и MIME-типов для видео
 */
const VIDEO_MIME_MAP: ExtensionMimeMap = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/avi',
  mov: 'video/quicktime',
};

/**
 * Карта соответствия расширений и MIME-типов для аудио
 */
const AUDIO_MIME_MAP: ExtensionMimeMap = {
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

/**
 * MIME-тип по умолчанию для документов
 */
const DEFAULT_DOCUMENT_MIME = 'application/octet-stream';

/**
 * Возвращает MIME-тип для расширения файла
 * @param extension - Расширение файла без точки
 * @param category - Категория медиа для выбора правильной карты
 * @returns MIME-тип или значение по умолчанию
 */
export function getMimeType(
  extension: string,
  category: 'photo' | 'video' | 'audio' | 'document'
): MimeType {
  const mimeMaps: Record<string, ExtensionMimeMap> = {
    photo: PHOTO_MIME_MAP,
    video: VIDEO_MIME_MAP,
    audio: AUDIO_MIME_MAP,
    document: {},
  };

  const mimeMap = mimeMaps[category];
  return mimeMap[extension.toLowerCase()] || DEFAULT_DOCUMENT_MIME;
}
