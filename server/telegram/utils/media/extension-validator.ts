/**
 * @fileoverview Утилиты для валидации расширений файлов
 * @module server/telegram/utils/extension-validator
 */

import type { AllowedExtensionsMap } from '../../types/media/allowed-extensions.js';

/**
 * Карта разрешённых расширений по категориям медиа
 */
const ALLOWED_EXTENSIONS: AllowedExtensionsMap = {
  photo: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'webm', 'avi', 'mov'],
  audio: ['mp3', 'ogg', 'wav', 'aac'],
  document: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar'],
};

/**
 * Проверяет, является ли расширение допустимым для указанной категории
 * @param extension - Расширение файла без точки
 * @param category - Категория медиа ('photo', 'video', 'audio', 'document')
 * @returns true, если расширение разрешено для категории
 */
export function validateExtension(
  extension: string,
  category: keyof AllowedExtensionsMap
): boolean {
  return ALLOWED_EXTENSIONS[category].includes(extension.toLowerCase());
}

/**
 * Возвращает список разрешённых расширений для категории
 * @param category - Категория медиа
 * @returns Массив разрешённых расширений
 */
export function getAllowedExtensions(category: keyof AllowedExtensionsMap): string[] {
  return ALLOWED_EXTENSIONS[category];
}
