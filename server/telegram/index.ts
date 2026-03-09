/**
 * @fileoverview Главный модуль Telegram
 * @module server/telegram
 * @description Предоставляет API для работы с Telegram Client и Bot API
 */

// Менеджеры клиентов (новая и старая версии)
export { telegramClientManager } from './telegram-client';
export { TelegramClientManagerV2 } from './services/client/telegram-client-manager-v2.js';

// Медиа-сервисы
export {
  downloadPhoto,
  downloadVideo,
  downloadAudio,
  downloadDocument
} from './telegram-media';

// Middleware
export { authMiddleware } from './auth-middleware';

// Утилиты
export { isApiCredentialsError, getFormattedQrError } from './utils/qr-auth-error-handler.js';