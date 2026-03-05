/**
 * @fileoverview Импорт и базовая проверка QR-токена
 * @module server/telegram/services/auth/qr-token-importer
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import {
  QR_CHECKING_TOKEN,
  QR_SCANNED_SUCCESS,
  QR_SESSION_STRING
} from './qr-error-messages.js';

/**
 * Результат импорта токена
 */
export interface TokenImportResult {
  /** Токен ещё не отсканирован */
  isPending: boolean;
  /** Токен успешно отсканирован */
  isSuccess: boolean;
  /** Строка сессии (если успешна) */
  sessionString?: string;
}

/**
 * Импортирует QR-токен и проверяет его статус
 *
 * @param client - Клиент Telegram
 * @param token - Токен QR-кода в base64
 * @returns Результат импорта токена
 */
export async function importQRToken(
  client: TelegramClient,
  token: string
): Promise<TokenImportResult> {
  const tokenPreview = token.substring(0, 20) + '...';
  console.log(`${QR_CHECKING_TOKEN} ${tokenPreview}`);

  const result = await client.invoke(
    new Api.auth.ImportLoginToken({
      token: Buffer.from(token, 'base64'),
    })
  );

  // QR ещё не отсканирован
  if (result instanceof Api.auth.LoginToken) {
    return { isPending: true, isSuccess: false };
  }

  // QR отсканирован успешно
  if (result instanceof Api.auth.LoginTokenSuccess) {
    const sessionString = client.session.save();
    console.log(`${QR_SCANNED_SUCCESS}`);
    console.log(`${QR_SESSION_STRING} ${sessionString}`);

    return {
      isPending: false,
      isSuccess: true,
      sessionString: String(sessionString),
    };
  }

  // Неизвестный статус
  return { isPending: false, isSuccess: false };
}

/**
 * Форматирует результат проверки QR-токена
 *
 * @param importResult - Результат импорта токена
 * @param client - Клиент Telegram для возврата
 * @returns Результат проверки статуса
 */
export function formatQRStatusResult(
  importResult: TokenImportResult,
  client: TelegramClient
): CheckQRStatusResult {
  if (importResult.isPending) {
    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  }

  if (importResult.isSuccess && importResult.sessionString) {
    return {
      success: true,
      isAuthenticated: true,
      sessionString: importResult.sessionString,
    };
  }

  return {
    success: false,
    error: 'Неизвестный статус QR',
  };
}
