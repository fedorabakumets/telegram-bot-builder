/**
 * @fileoverview Экспорт компонентов и типов Telegram Client API
 *
 * @module telegram-client
 */

export { TelegramClientConfig } from './TelegramClientConfig';
export { GroupMembersClientPanel } from './GroupMembersClientPanel';
export { TEST_CONFIG } from './test-config';

// Типы
export type {
  AuthStatus,
  ApiCredentials,
  TelegramAuthProps,
  GroupMembersClientPanelProps,
  QrCodeGeneratorProps,
} from './types';
