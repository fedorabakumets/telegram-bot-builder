/**
 * @fileoverview Сервис для скачивания документов из Telegram
 * @module server/telegram/services/document-service
 */

import { join } from 'path';
import type { DownloadedMedia } from '../types/index.js';
import { sanitizeFileId, generateFileName } from '../utils/file-utils.js';
import { validateExtension } from '../utils/extension-validator.js';
import { getMimeType } from '../utils/mime-utils.js';
import { createUploadDir, validateFilePath } from '../utils/path-utils.js';
import { getTelegramFileInfo } from '../utils/http-utils.js';
import { downloadFile } from '../utils/download-utils.js';

/**
 * Скачивает документ из Telegram через Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id документа из Telegram
 * @param projectId - ID проекта для организации файлов
 * @param originalFileName - Оригинальное имя файла (опционально)
 * @returns Информация о скачанном файле
 */
export async function downloadDocument(
  botToken: string,
  fileId: string,
  projectId: number,
  originalFileName?: string
): Promise<DownloadedMedia> {
  try {
    const fileInfo = await getTelegramFileInfo(botToken, fileId);
    const filePath = fileInfo.file_path;
    const fileSize = fileInfo.file_size || 0;

    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    if (!validateExtension(extension, 'document')) {
      throw new Error('Некорректный тип файла');
    }

    const mimeType = getMimeType(extension, 'document');

    const date = new Date().toISOString().split('T')[0];
    const uploadDir = createUploadDir(projectId, date);
    const safeFileId = sanitizeFileId(fileId);

    // Санитизация originalFileName
    const sanitizedFileName = originalFileName?.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
    const fileName = sanitizedFileName || generateFileName(safeFileId, extension);
    const localFilePath = join(uploadDir, fileName);

    validateFilePath(uploadDir, localFilePath);

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    await downloadFile(downloadUrl, localFilePath);

    const relativeFilePath = join('uploads', String(projectId), date, fileName);

    return { filePath: relativeFilePath, fileSize, mimeType, fileName };
  } catch (error) {
    console.error('Ошибка при скачивании документа из Telegram:', error);
    throw new Error(`Не удалось скачать документ: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}
