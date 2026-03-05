// Telegram module exports
export { telegramClientManager } from './telegram-client';
export {
  downloadPhoto,
  downloadVideo,
  downloadAudio,
  downloadDocument
} from './telegram-media';
export { authMiddleware } from './auth-middleware';
export { isApiCredentialsError, getFormattedQrError } from './utils/qr-auth-error-handler.js';