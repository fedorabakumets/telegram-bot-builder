/**
 * @fileoverview Баррер-файл для экспорта всех типов модуля Telegram
 * @module server/telegram/types/index
 * @description Экспортирует типы для работы с медиа, авторизацией, клиентами и валидацией
 */

export type { DownloadedMedia } from './media/downloaded-media.js';
export type { MediaDownloadParams } from './media/media-download-params.js';
export type { FileExtension } from './media/file-extension.js';
export type { MediaCategory } from './media/media-category.js';
export type { MimeType } from './media/mime-type.js';
export type { AllowedExtensionsMap } from './media/allowed-extensions.js';
export type { ExtensionMimeMap } from './media/extension-mime-map.js';
export type { PathValidationResult } from './media/path-validation.js';
export type { HttpTimeoutOptions } from './media/http-request.js';
export type { TelegramFileInfo } from './media/telegram-file-info.js';

export * from './auth/index.js';
export * from './client/index.js';

// Валидация (новое)
export * from './validation-error.js';
