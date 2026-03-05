/**
 * @fileoverview Верификация 2FA пароля при QR-авторизации
 * @module server/telegram/services/auth/qr-2fa-verifier
 */

import { TelegramClient } from 'telegram';
import type { VerifyPasswordResult } from '../../types/auth/verify-password-result.js';
import { verifyPassword } from './2fa-service.js';
import {
  QR_CHECKING_2FA,
  QR_2FA_VERIFIED,
  QR_2FA_ERROR
} from './qr-error-messages.js';

/**
 * Результат верификации 2FA
 */
export interface TwoFAVerificationResult {
  /** Успешна ли верификация */
  isSuccess: boolean;
  /** Сообщение об ошибке */
  error?: string;
  /** Требуется ли повторный ввод пароля */
  needsPassword?: boolean;
}

/**
 * Проверяет 2FA пароль при QR-авторизации
 *
 * @param client - Клиент Telegram
 * @param password - Пароль 2FA
 * @returns Результат верификации
 */
export async function verifyQR2FAPassword(
  client: TelegramClient,
  password: string
): Promise<TwoFAVerificationResult> {
  try {
    console.log(QR_CHECKING_2FA);

    const result = await verifyPassword(client, password);

    if (!result.success) {
      return {
        isSuccess: false,
        error: result.error,
        needsPassword: true,
      };
    }

    console.log(QR_2FA_VERIFIED);

    return {
      isSuccess: true,
    };
  } catch (error: any) {
    return handle2FAVerificationError(error);
  }
}

/**
 * Обрабатывает ошибки верификации 2FA
 */
function handle2FAVerificationError(error: any): TwoFAVerificationResult {
  if (error.message?.includes('PASSWORD_HASH_INVALID')) {
    return {
      isSuccess: false,
      error: 'Неверный пароль 2FA',
      needsPassword: true,
    };
  }

  console.error(QR_2FA_ERROR, error.message);
  return {
    isSuccess: false,
    error: error.message || 'Ошибка проверки 2FA',
  };
}
