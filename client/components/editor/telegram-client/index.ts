/**
 * @fileoverview Экспорт компонентов, хуков, типов и сервисов модуля telegram-client
 *
 * @module telegram-client
 */

export { TelegramClientConfig } from './TelegramClientConfig'

// Хуки
export { useTelegramAuth } from './hooks';
export type { UseTelegramAuthReturn } from './hooks';

// Компоненты
export {
  ClientApiCardHeader,
  WarningAlert,
  ApiCredentialsForm,
  ApiCredentialsSaved,
  AuthStatusPanel,
  QrCodeGenerator,
} from './components';
export type {
  ApiCredentialsFormProps,
  ApiCredentialsSavedProps,
  AuthStatusPanelProps,
  QrCodeGeneratorProps,
} from './components';

// Типы
export type {
  AuthStatus,
  ApiCredentials,
  TelegramAuthProps,
} from './types';

// Сервисы
export {
  HttpClient,
  createHttpClient,
  TelegramAuthService,
  createNotificationService,
  validateApiCredentials,
  isValidCredentials,
  LoggerService,
  createLogger,
} from './services';
export type {
  HttpMethod,
  HttpOptions,
  NotificationService,
  ValidationErrors,
  LoggerOptions,
  LogLevel,
  LoggerTransport,
} from './services';

// Константы
export {
  QR_POLL_INTERVAL,
  QR_TOKEN_EXPIRY,
  QR_ERROR_CORRECTION,
  QR_DEFAULT_SIZE,
  REQUEST_TIMEOUT,
  MAX_RETRY_ATTEMPTS,
} from './constants';
