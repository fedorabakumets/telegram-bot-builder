/**
 * @fileoverview Экспорт хуков и функций модуля telegram-client
 *
 * @module hooks
 */

// Главный хук
export { useTelegramAuth } from './use-telegram-auth';
export type { UseTelegramAuthReturn } from './use-telegram-auth';

// Отдельные функции
export { loadAuthStatus } from './load-auth-status';
export { saveCredentials } from './save-credentials';
export type { SaveCredentialsResult } from './save-credentials';
export { logout } from './logout';
export type { LogoutResult } from './logout';
export { resetCredentials } from './reset-credentials';
export type { ResetCredentialsResult } from './reset-credentials';
