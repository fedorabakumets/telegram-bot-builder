/**
 * @fileoverview Баррер-файл для экспорта всех сервисов медиа
 * @module server/telegram/services/media/index
 * @description Экспортирует сервисы для скачивания медиафайлов из Telegram
 */

export { downloadPhoto } from './photo-service.js';
export { downloadVideo } from './video-service.js';
export { downloadAudio } from './audio-service.js';
export { downloadDocument } from './document-service.js';
