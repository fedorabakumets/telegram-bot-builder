/**
 * @fileoverview Баррер-файл для экспорта всех типов авторизации
 * @module server/telegram/types/auth/index
 * @description Экспортирует типы для QR и 2FA авторизации
 */

export type { VerifyPasswordResult } from './verify-password-result.js';
export type { GenerateQRResult } from './generate-qr-result.js';
export type { GenerateQRTokenResult } from './generate-qr-token-result.js';
export type { CheckQRStatusResult } from './check-qr-status-result.js';
export type { CredentialsResult } from './credentials-result.js';
export type { UserCredentials } from './user-credentials.js';
