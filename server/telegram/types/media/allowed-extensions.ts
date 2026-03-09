/**
 * @fileoverview Конфигурация разрешённых расширений для каждой категории медиа
 * @module server/telegram/types/allowed-extensions.ts
 */

/**
 * Карта разрешённых расширений файлов по категориям медиа
 * @example
 * {
 *   photo: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
 *   video: ['mp4', 'webm', 'avi', 'mov'],
 *   audio: ['mp3', 'ogg', 'wav', 'aac'],
 *   document: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar']
 * }
 */
export type AllowedExtensionsMap = Record<string, string[]>;
