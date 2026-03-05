/**
 * @fileoverview Сервис проверки статуса QR-токена Telegram
 * @module server/telegram/services/auth/qr-status-checker
 */

import type { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { getOrCreateQRClient } from './qr-client-manager.js';
import { importQRToken, formatQRStatusResult } from './qr-token-importer.js';
import { handleQRPasswordError } from './qr-2fa-processor.js';

/**
 * Проверяет статус QR-токена (отсканирован ли он пользователем)
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @param token - Токен QR-кода в base64
 * @param password - Пароль 2FA (если требуется)
 * @param existingClient - Существующий клиент для повторного использования
 * @returns Результат проверки статуса QR
 */
export async function checkQRStatus(
  apiId: string,
  apiHash: string,
  token: string,
  password?: string,
  existingClient?: TelegramClient
): Promise<CheckQRStatusResult> {
  // Создаём или переиспользуем клиента
  const client = await getOrCreateQRClient(existingClient, { apiId, apiHash });

  try {
    // Импортируем токен и проверяем статус
    const importResult = await importQRToken(client, token);

    // Если статус определён — возвращаем результат
    if (!importResult.isPending && !importResult.isSuccess) {
      return {
        success: false,
        error: 'Неизвестный статус QR',
      };
    }

    // Если не отсканирован или отсканирован без 2FA
    if (importResult.isPending || importResult.isSuccess) {
      return formatQRStatusResult(importResult, client);
    }

    return {
      success: false,
      error: 'Неизвестный статус QR',
    };
  } catch (error: any) {
    // Обрабатываем ошибку (возможно 2FA)
    return handleQRPasswordError(error, client, apiId, apiHash, password);
  }
}
