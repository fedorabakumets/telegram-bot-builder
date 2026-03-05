/**
 * @fileoverview Баррер-файл для экспорта всех типов авторизации
 * @module server/telegram/types/auth/index
 */

export type { SendCodeResult } from './send-code-result.js';
export type { VerifyCodeResult } from './verify-code-result.js';
export type { VerifyPasswordResult } from './verify-password-result.js';
export type { GenerateQRResult } from './generate-qr-result.js';
export type { GenerateQRTokenResult } from './generate-qr-token-result.js';
export type { CheckQRStatusResult } from './check-qr-status-result.js';
export type { CredentialsResult } from './credentials-result.js';
export type { UserCredentials } from './user-credentials.js';
