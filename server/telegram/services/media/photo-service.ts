/**
 * @fileoverview Сервис для скачивания фото из Telegram
 * @module server/telegram/services/photo-service
 */

import { join } from 'path';
import type { DownloadedMedia } from '../../types/index.js';
import { sanitizeFileId, generateFileName } from '../../utils/media/file-utils.js';
import { validateExtension } from '../../utils/media/extension-validator.js';
import { getMimeType } from '../../utils/media/mime-utils.js';
import { createUploadDir, validateFilePath } from '../../utils/media/path-utils.js';
import { getTelegramFileInfo } from '../../utils/media/http-utils.js';
import { downloadFile } from '../../utils/media/download-utils.js';

/**
 * Скачивает фото из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id фото из Telegram
 * @param projectId - ID проекта для организации файлов
 * @returns Информация о скачанном файле
 */
export async function downloadPhoto(
  botToken: string,
  fileId: string,
  projectId: number
): Promise<DownloadedMedia> {
  try {
    // Шаг 1: Получаем информацию о файле
    const fileInfo = await getTelegramFileInfo(botToken, fileId);
    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;

    // Шаг 2: Определяем расширение и валидируем
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    if (!validateExtension(extension, 'photo')) {
      throw new Error('Некорректный тип файла');
    }

    // Шаг 3: Получаем MIME-тип
    const mimeType = getMimeType(extension, 'photo');

    // Шаг 4: Создаём директорию и генерируем имя файла
    const date = new Date().toISOString().split('T')[0];
    const uploadDir = createUploadDir(projectId, date);
    const safeFileId = sanitizeFileId(fileId);
    const fileName = generateFileName(safeFileId, extension);
    const localFilePath = join(uploadDir, fileName);

    // Шаг 5: Валидируем путь
    validateFilePath(uploadDir, localFilePath);

    // Шаг 6: Скачиваем файл
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    await downloadFile(downloadUrl, localFilePath);

    // Шаг 7: Возвращаем относительный путь
    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return { filePath: relativeFilePath, fileSize, mimeType, fileName };
  } catch (error) {
    console.error('Ошибка при скачивании фото из Telegram:', error);
    throw new Error(`Не удалось скачать фото: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}
