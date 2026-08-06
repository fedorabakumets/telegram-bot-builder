/**
 * @fileoverview Главный модуль Telegram
 * @module server/telegram
 * @description Middleware авторизации Studio и скачивание медиа через Bot API
 */

export {
  downloadPhoto,
  downloadVideo,
  downloadAudio,
  downloadDocument
} from './telegram-media';

export { authMiddleware, getOwnerIdFromRequest, requireAuth } from './auth-middleware';
