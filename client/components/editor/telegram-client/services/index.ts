/**
 * @fileoverview Экспорт всех сервисов модуля telegram-client
 *
 * Централизованный экспорт сервисов.
 *
 * @module services
 */

export {
  TelegramAuthService,
  createTelegramAuthService,
} from './telegram-auth-service';
export type { QrGenerateResponse, QrCheckResponse } from './telegram-auth-service';

export {
  createNotificationService,
} from './notification-service';
export type { NotificationService, NotificationOptions } from './notification-service';

export {
  validateApiCredentials,
  isValidCredentials,
} from './validation-service';
export type { ValidationErrors } from './validation-service';
