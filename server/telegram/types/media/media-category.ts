/**
 * @fileoverview Типы категорий медиафайлов
 * @module server/telegram/types/media-category.ts
 */

/**
 * Категория медиафайла для определения типа обработки
 */
export type MediaCategory = 'photo' | 'video' | 'audio' | 'document' | 'sticker';
