/**
 * @fileoverview Экспорт компонентов и типов модуля telegram-client
 *
 * @module telegram-client
 */

export { TelegramClientConfig } from './TelegramClientConfig';
export { GroupMembersClientPanel } from './GroupMembersClientPanel'

// Хуки
export { useTelegramAuth } from './hooks';
export type { UseTelegramAuthReturn } from './hooks';

// Типы
export type {
  AuthStatus,
  ApiCredentials,
  TelegramAuthProps,
  GroupMembersClientPanelProps,
  QrCodeGeneratorProps,
} from './types';
