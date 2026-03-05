/**
 * @fileoverview Экспорт компонентов, хуков и типов модуля telegram-client
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
