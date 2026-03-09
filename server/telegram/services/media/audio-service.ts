/**
 * @fileoverview Сервис для скачивания аудио из Telegram
 * @module server/telegram/services/audio-service
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
 * Скачивает аудио из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id аудио из Telegram
 * @param projectId - ID проекта для организации файлов
 * @returns Информация о скачанном файле
 */
export async function downloadAudio(
  botToken: string,
  fileId: string,
  projectId: number
): Promise<DownloadedMedia> {
  try {
    const fileInfo = await getTelegramFileInfo(botToken, fileId);
    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;

    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    if (!validateExtension(extension, 'audio')) {
      throw new Error('Некорректный тип файла');
    }

    const mimeType = getMimeType(extension, 'audio');

    const date = new Date().toISOString().split('T')[0];
    const uploadDir = createUploadDir(projectId, date);
    const safeFileId = sanitizeFileId(fileId);
    const fileName = generateFileName(safeFileId, extension);
    const localFilePath = join(uploadDir, fileName);

    validateFilePath(uploadDir, localFilePath);

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    await downloadFile(downloadUrl, localFilePath);

    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return { filePath: relativeFilePath, fileSize, mimeType, fileName };
  } catch (error) {
    console.error('Ошибка при скачивании аудио из Telegram:', error);
    throw new Error(`Не удалось скачать аудио: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}
