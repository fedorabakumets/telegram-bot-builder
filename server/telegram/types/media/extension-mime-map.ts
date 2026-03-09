/**
 * @fileoverview Карта соответствия расширений файлов и MIME-типов
 * @module server/telegram/types/extension-mime-map.ts
 */

/**
 * Карта соответствия расширений файлов и их MIME-типов
 * @example
 * {
 *   'jpg': 'image/jpeg',
 *   'mp4': 'video/mp4',
 *   'mp3': 'audio/mpeg'
 * }
 */
export type ExtensionMimeMap = Record<string, string>;
