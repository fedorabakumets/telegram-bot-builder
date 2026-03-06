/**
 * @fileoverview Баррер-файл для экспорта всех утилит модуля Telegram
 * @module server/telegram/utils/index
 * @description Экспортирует утилиты для работы с медиа, авторизацией и валидацией
 */

export { sanitizeFileId, generateFileName } from './media/file-utils.js';
export { validateExtension, getAllowedExtensions } from './media/extension-validator.js';
export { getMimeType } from './media/mime-utils.js';
export { createUploadDir, validateFilePath } from './media/path-utils.js';
export { httpsGet, getTelegramFileInfo } from './media/http-utils.js';
export { downloadFile } from './media/download-utils.js';
export { isApiCredentialsError, getFormattedQrError } from './qr-auth-error-handler.js';

export * from './auth/index.js';

// Валидация (новое)
export * from './validation/index.js';
