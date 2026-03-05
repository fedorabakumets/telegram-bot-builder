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
  WarningAlert,
  ApiCredentialsForm,
  ApiCredentialsSaved,
  AuthStatusPanel,
} from './components';
export type {
  ApiCredentialsFormProps,
  ApiCredentialsSavedProps,
  AuthStatusPanelProps,
} from './components';

// Типы
export type {
  AuthStatus,
  ApiCredentials,
  TelegramAuthProps,
  GroupMembersClientPanelProps,
  QrCodeGeneratorProps,
} from './types';
