// Telegram module exports
export { telegramClientManager } from './telegram-client';
export {
  downloadTelegramPhoto,
  downloadTelegramVideo,
  downloadTelegramAudio,
  downloadTelegramDocument
} from './telegram-media';
export { authMiddleware } from './auth-middleware';
export { isApiCredentialsError, getFormattedQrError } from './utils/qr-auth-error-handler.js';