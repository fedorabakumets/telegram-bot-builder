/**
 * @fileoverview Баррер-файл для экспорта всех типов клиента Telegram
 * @module server/telegram/types/client/index
 * @description Экспортирует типы и интерфейсы для работы с Telegram Client
 */

// Интерфейсы модулей (новая архитектура)
export type {
  IAuthModule,
  ISessionModule,
  IChatModule,
  IGroupModule
} from './modules.js';

// Основные типы
export type { TelegramClientConfig } from './telegram-client-config.js';
export type { AuthStatus } from './auth-status.js';
export type { AuthStatusExtended } from './auth-status-extended.js';
export type { AdminRights } from './admin-rights.js';
export type { BannedRights } from './banned-rights.js';
export type { GroupMember } from './group-member.js';
export type { ChatInfo } from './chat-info.js';
