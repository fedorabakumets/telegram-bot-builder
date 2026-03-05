/**
 * @fileoverview Сервис проверки статуса QR-токена Telegram
 * @module server/telegram/services/auth/qr-status-checker
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { verifyPassword } from './2fa-service.js';
import { generateQRToken } from './qr-generator.js';

/**
 * Проверяет статус QR-токена (отсканирован ли он пользователем)
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @param token - Токен QR-кода в base64
 * @param password - Пароль 2FA (если требуется)
 * @param existingClient - Существующий клиент для повторного использования
 * @returns Результат проверки статуса QR
 *
 * @example
 * ```typescript
 * const result = await checkQRStatus('19827705', '52359acb...', 'token123');
 * if (result.success && result.isAuthenticated) {
 *   console.log('QR отсканирован!');
 * }
 * ```
 */
export async function checkQRStatus(
  apiId: string,
  apiHash: string,
  token: string,
  password?: string,
  existingClient?: TelegramClient
): Promise<CheckQRStatusResult> {
  let client = existingClient;

  try {
    // Если нет существующего клиента — создаём новый
    if (!client) {
      console.log('🆕 Создание нового QR-клиента');
      client = new TelegramClient(
        new StringSession(''),
        parseInt(apiId),
        apiHash,
        {
          connectionRetries: 5,
          timeout: 30000,
          useWSS: false,
          autoReconnect: false,
        }
      );
      await client.connect();
    } else {
      console.log('♻️ Использование существующего QR-клиента');
    }

    // Проверяем статус токена
    const tokenPreview = token.substring(0, 20) + '...';
    console.log(`🔍 Проверка токена: ${tokenPreview}`);

    const result = await client.invoke(
      new Api.auth.ImportLoginToken({
        token: Buffer.from(token, 'base64'),
      })
    );

    // LoginToken - QR ещё не отсканирован
    if (result instanceof Api.auth.LoginToken) {
      console.log('♻️ Возвращаем клиент для повторного использования');
      return {
        success: true,
        isAuthenticated: false,
        client,
      };
    }

    // LoginTokenSuccess - QR отсканирован (без 2FA)
    if (result instanceof Api.auth.LoginTokenSuccess) {
      const sessionString = client.session.save();

      console.log('✅ QR отсканирован!');
      console.log('📦 Session String:', sessionString);

      return {
        success: true,
        isAuthenticated: true,
        sessionString: String(sessionString),
      };
    }

    return {
      success: false,
      error: 'Неизвестный статус QR',
    };
  } catch (error: any) {
    // SESSION_PASSWORD_NEEDED — требуется 2FA пароль
    return await handleQRPasswordError(
      error,
      client,
      apiId,
      apiHash,
      password
    );
  }
}

/**
 * Обрабатывает ошибку 2FA при проверке QR-токена
 */
async function handleQRPasswordError(
  error: any,
  client: TelegramClient,
  apiId: string,
  apiHash: string,
  password?: string
): Promise<CheckQRStatusResult> {
  if (!error.message?.includes('SESSION_PASSWORD_NEEDED')) {
    // AUTH_TOKEN_EXPIRED — нормально для polling
    if (error.message?.includes('AUTH_TOKEN_EXPIRED')) {
      console.log('ℹ️ Токен уже был проверен — это нормально для polling');
      return {
        success: true,
        isAuthenticated: false,
        client,
      };
    }

    console.error('❌ Ошибка проверки QR:', error.message);
    return {
      success: false,
      error: error.message || 'Ошибка проверки QR',
      client,
    };
  }

  console.log('🔐 QR требует 2FA пароль');

  // Если пароль не передан — запрашиваем его
  if (!password) {
    return {
      success: true,
      isAuthenticated: false,
      needsPassword: true,
      client,
    };
  }

  try {
    console.log('🔐 Проверка 2FA пароля для QR...');

    // Проверяем пароль через 2FA сервис
    const passwordResult = await verifyPassword(client, password);
    if (!passwordResult.success) {
      return {
        success: false,
        error: passwordResult.error,
        needsPassword: true,
      };
    }

    console.log('✅ 2FA пароль проверен для QR');

    // После успешной проверки — получаем сессию
    const finalResult = await generateQRToken(client, apiId, apiHash);

    if (finalResult.success && finalResult.token) {
      const sessionString = client.session.save();
      console.log('✅ QR отсканирован с 2FA!');
      console.log('📦 Session String:', sessionString);

      return {
        success: true,
        isAuthenticated: true,
        sessionString: String(sessionString),
        client,
      };
    }

    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  } catch (error: any) {
    if (error.message?.includes('PASSWORD_HASH_INVALID')) {
      return {
        success: false,
        error: 'Неверный пароль 2FA',
        needsPassword: true,
      };
    }
    console.error('❌ Ошибка проверки 2FA:', error.message);
    return {
      success: false,
      error: error.message || 'Ошибка проверки 2FA',
    };
  }
}
