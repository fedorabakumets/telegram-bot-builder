/**
 * @fileoverview Экспорт хуков и функций модуля telegram-client
 *
 * @module hooks
 */

// Главные хуки
export { useTelegramAuth } from './use-telegram-auth';
export type { UseTelegramAuthReturn } from './use-telegram-auth';

export { useTelegramAuthState } from './use-telegram-auth-state';
export type { UseTelegramAuthStateReturn } from './use-telegram-auth-state';

export { useTelegramAuthActions } from './use-telegram-auth-actions';
export type { UseTelegramAuthActionsReturn, UseTelegramAuthActionsParams } from './use-telegram-auth-actions';

export { useQrAuth } from './use-qr-auth';
export type { UseQrAuthReturn } from './use-qr-auth';

// QR действия
export * from './qr-actions';

// Фабрики действий
export * from './actions';

// Отдельные функции
export { loadAuthStatus } from './load-auth-status';
export { saveCredentials } from './save-credentials';
export type { SaveCredentialsResult } from './save-credentials';
export { logout } from './logout';
export type { LogoutResult } from './logout';
export { resetCredentials } from './reset-credentials';
export type { ResetCredentialsResult } from './reset-credentials';
