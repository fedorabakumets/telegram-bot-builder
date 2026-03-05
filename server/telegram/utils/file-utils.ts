/**
 * @fileoverview Утилиты для санитизации и генерации имён файлов
 * @module server/telegram/utils/file-utils
 */

import type { FileExtension } from '../types/file-extension.js';

/**
 * Санитизирует file_id из Telegram, оставляя только безопасные символы
 * @param fileId - Исходный file_id из Telegram
 * @param maxLength - Максимальная длина результата (по умолчанию 20)
 * @returns Строка с безопасными символами (a-z, A-Z, 0-9, _, -)
 */
export function sanitizeFileId(fileId: string, maxLength = 20): string {
  return fileId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, maxLength);
}

/**
 * Генерирует уникальное имя файла с временной меткой и случайным суффиксом
 * @param fileId - Санитизированный file_id
 * @param extension - Расширение файла
 * @returns Уникальное имя файла в формате: timestamp-randomSuffix-fileId.extension
 */
export function generateFileName(
  fileId: string,
  extension: FileExtension
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  return `${timestamp}-${randomSuffix}-${fileId}.${extension}`;
}
