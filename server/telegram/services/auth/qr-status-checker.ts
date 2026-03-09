/**
 * @fileoverview Сервис проверки статуса QR-токена Telegram
 * @module server/telegram/services/auth/qr-status-checker
 */

import type { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { getOrCreateQRClient } from './qr-client-manager.js';
import { importQRToken } from './qr-token-importer.js';
import { handleQRPasswordError } from './qr-2fa-processor.js';
import { verifyQR2FAPassword } from './qr-2fa-verifier.js';
import { extractQRSessionAfter2FA } from './qr-session-extractor.js';

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

    console.log('📋 importResult:', {
      success: importResult.success,
      isAuthenticated: importResult.isAuthenticated,
      hasPassword: !!password,
    });

    // Если токен импортирован успешно и требуется 2FA пароль
    if (importResult.success && !importResult.isAuthenticated && password) {
      console.log('🔐 Проверка 2FA пароля после успешного импорта токена...');
      
      // Проверяем пароль 2FA
      const verification = await verifyQR2FAPassword(client, password);
      if (!verification.isSuccess) {
        console.log('❌ 2FA проверка не удалась:', verification.error);
        return {
          success: false,
          error: verification.error,
          needsPassword: verification.needsPassword,
          client,
        };
      }

      console.log('✅ 2FA проверка успешна, извлекаем сессию...');
      // Извлекаем сессию после успешной проверки
      return extractQRSessionAfter2FA(client, apiId, apiHash);
    }

    // result уже содержит готовый CheckQRStatusResult
    // Добавляем client только если его нет (для pending случая)
    if (!importResult.client && importResult.success && !importResult.isAuthenticated) {
      importResult.client = client;
    }

    return importResult;
  } catch (error: any) {
    // Обрабатываем ошибку (возможно 2FA)
    console.log('⚠️ Ошибка при импорте токена:', error.message);
    return handleQRPasswordError(error, client, apiId, apiHash, password);
  }
}
