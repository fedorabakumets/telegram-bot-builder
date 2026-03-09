/**
 * @fileoverview Модуль для скачивания медиафайлов из Telegram
 * @module server/telegram/telegram-media
 * @description Ре-экспортирует сервисы для обратной совместимости
 */

export { downloadPhoto, downloadVideo, downloadAudio, downloadDocument } from './services/index.js';
