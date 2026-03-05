/**
 * @fileoverview Сервис авторизации Telegram Client API
 *
 * Предоставляет современные методы авторизации:
 * - Отправка кода подтверждения через SMS/звонок
 * - Проверка кода подтверждения
 * - Повторная отправка кода
 * - QR-код авторизация (по современному стандарту Telegram)
 * - 2FA поддержка
 *
 * Использует актуальные методы Telegram API:
 * - auth.sendCode (вместо устаревшего auth.SendCode)
 * - auth.signIn
 * - auth.exportLoginToken / auth.acceptLoginToken для QR
 *
 * @module telegram-auth-service
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../database/db';
import type { VerifyPasswordResult } from './types/auth/verify-password-result.js';

/**
 * Сервис авторизации Telegram
 */
class TelegramAuthService {






  /**
   * Проверяет пароль двухфакторной аутентификации (2FA)
   *
   * @param {TelegramClient} client - Подключенный клиент Telegram
   * @param {string} password - Пароль 2FA
   * @returns {Promise<VerifyPasswordResult>} Результат проверки
   *
   * @example
   * ```typescript
   * const result = await verifyPassword(client, 'mySecretPassword');
   * if (result.success) {
   *   console.log('2FA авторизация успешна');
   * }
   * ```
   */
  async verifyPassword(
    client: TelegramClient,
    password: string
  ): Promise<VerifyPasswordResult> {
    try {
      // Получаем информацию о пароле
      const passwordInfo = await client.invoke(new Api.account.GetPassword());

      // Импортируем функцию для вычисления проверки пароля
      const { computeCheck } = await import('telegram/Password');

      // Вычисляем проверку пароля
      const passwordCheck = await computeCheck(passwordInfo, password);

      // Проверяем пароль
      await client.invoke(
        new Api.auth.CheckPassword({
          password: passwordCheck,
        })
      );

      console.log('✅ 2FA пароль проверен успешно');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Ошибка проверки 2FA пароля:', error.message);
      return {
        success: false,
        error: error.message || 'Неверный пароль 2FA',
      };
    }
  }

  /**
   * Генерирует QR-код для авторизации
   *
   * @param {string} apiId - API ID приложения
   * @param {string} apiHash - API Hash приложения
   * @returns {Promise<{success: boolean; qrUrl?: string; token?: string; error?: string}>}
   *
   * @example
   * ```typescript
   * const result = await generateQR('19827705', '52359acb...');
   * if (result.success) {
   *   console.log('QR URL:', result.qrUrl);
   * }
   * ```
   */
  async generateQR(
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; qrUrl?: string; token?: string; error?: string }> {
    try {
      const client = new TelegramClient(
        new StringSession(''),
        parseInt(apiId),
        apiHash,
        {
          connectionRetries: 5,
          timeout: 30000,
        }
      );

      await client.connect();

      const result = await client.invoke(
        new Api.auth.ExportLoginToken({
          apiId: parseInt(apiId),
          apiHash,
          exceptIds: [],
        })
      );

      if (result instanceof Api.auth.LoginToken) {
        const tokenBase64 = Buffer.from(result.token).toString('base64url');
        const qrUrl = `tg://login?token=${tokenBase64}`;

        return {
          success: true,
          qrUrl,
          token: Buffer.from(result.token).toString('base64'),
        };
      }

      return {
        success: false,
        error: 'Неожиданный тип ответа от сервера',
      };
    } catch (error: any) {
      console.error('❌ Ошибка генерации QR:', error.message);
      return {
        success: false,
        error: error.message || 'Не удалось создать QR-код',
      };
    }
  }

  /**
   * Сохраняет API credentials в базу данных
   *
   * @param {string} userId - ID пользователя
   * @param {string} apiId - API ID
   * @param {string} apiHash - API Hash
   * @returns {Promise<{success: boolean; error?: string}>}
   */
  async saveCredentials(
    userId: string,
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await db
        .select()
        .from(userTelegramSettings)
        .where(eq(userTelegramSettings.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userTelegramSettings)
          .set({ apiId, apiHash, updatedAt: new Date() })
          .where(eq(userTelegramSettings.userId, userId));
      } else {
        await db.insert(userTelegramSettings).values({
          userId,
          apiId,
          apiHash,
        });
      }

      console.log(`💾 API credentials сохранены для пользователя ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Ошибка сохранения credentials:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Загружает credentials из базы данных
   *
   * @param {string} userId - ID пользователя
   * @returns {Promise<{apiId?: string; apiHash?: string} | null>}
   */
  async loadCredentials(
    userId: string
  ): Promise<{ apiId?: string; apiHash?: string } | null> {
    try {
      const result = await db
        .select()
        .from(userTelegramSettings)
        .where(eq(userTelegramSettings.userId, userId))
        .limit(1);

      if (result.length > 0 && result[0].apiId && result[0].apiHash) {
        return { apiId: result[0].apiId, apiHash: result[0].apiHash };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки credentials:', error.message);
      return null;
    }
  }

  /**
   * Генерирует новый QR-токен (обновляет существующий)
   *
   * @param {TelegramClient} client - Подключенный клиент
   * @param {string} apiId - API ID
   * @param {string} apiHash - API Hash
   * @returns {Promise<{success: boolean; token?: string; qrUrl?: string; expires?: number; error?: string}>}
   */
  async generateQRToken(
    client: TelegramClient,
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; token?: string; qrUrl?: string; expires?: number; error?: string }> {
    try {
      const result = await client.invoke(
        new Api.auth.ExportLoginToken({
          apiId: parseInt(apiId),
          apiHash,
          exceptIds: [],
        })
      );

      if (result instanceof Api.auth.LoginToken) {
        const tokenBase64 = Buffer.from(result.token).toString('base64url');
        const qrUrl = `tg://login?token=${tokenBase64}`;
        const tokenPreview = Buffer.from(result.token).toString('base64').substring(0, 20) + '...';
        
        // expires — это абсолютное время (Unix timestamp), конвертируем в секунды
        const now = Math.floor(Date.now() / 1000);
        const expiresInSeconds = result.expires - now;

        console.log(`✅ QR-токен сгенерирован (expires: ${expiresInSeconds}с, token: ${tokenPreview})`);

        return {
          success: true,
          token: Buffer.from(result.token).toString('base64'),
          qrUrl,
          expires: expiresInSeconds,
        };
      }

      // Если сразу вернулся MigrateTo — обрабатываем
      if (result instanceof Api.auth.LoginTokenMigrateTo) {
        console.log('🔄 QR: миграция на DC', result.dcId);
        
        // Мигрируем на нужный DC
        await client._switchDC(result.dcId);
        
        // Ждём немного после миграции
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Повторяем экспорт токена на новом DC — это вернёт НОВЫЙ токен
        console.log('🔄 Повторный экспорт токена после миграции...');
        return await this.generateQRToken(client, apiId, apiHash);
      }

      return {
        success: false,
        error: 'Неожиданный тип ответа',
      };
    } catch (error: any) {
      console.error('❌ Ошибка генерации QR-токена:', error.message);
      return {
        success: false,
        error: error.message || 'Ошибка генерации QR',
      };
    }
  }

  /**
   * Проверяет статус QR-токена (отсканирован ли он)
   * 
   * ВНИМАНИЕ: Этот метод НЕ должен вызываться часто, так как importLoginToken
   * помечает токен как использованный!
   *
   * @param {string} apiId - API ID приложения
   * @param {string} apiHash - API Hash приложения
   * @param {string} token - Токен QR-кода
   * @param {string} [password] - Пароль 2FA (если требуется)
   * @param {TelegramClient} [existingClient] - Существующий клиент для повторного использования
   * @returns {Promise<{success: boolean; isAuthenticated?: boolean; error?: string; needsPassword?: boolean; sessionString?: string; client?: TelegramClient}>}
   *
   * @example
   * ```typescript
   * const result = await checkQRStatus('19827705', '52359acb...', 'token123');
   * if (result.success && result.isAuthenticated) {
   *   console.log('QR отсканирован!');
   * } else if (result.needsPassword) {
   *   console.log('Требуется 2FA пароль');
   * }
   * ```
   */
  async checkQRStatus(
    apiId: string,
    apiHash: string,
    token: string,
    password?: string,
    existingClient?: TelegramClient
  ): Promise<{
    success: boolean;
    isAuthenticated?: boolean;
    error?: string;
    needsPassword?: boolean;
    sessionString?: string;
    client?: TelegramClient;
  }> {
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
          client, // Возвращаем клиент для повторного использования
        };
      }

      // LoginTokenSuccess - QR отсканирован (без 2FA)
      if (result instanceof Api.auth.LoginTokenSuccess) {
        // Сохраняем сессию
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
      if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
        console.log('🔐 QR требует 2FA пароль');

        // Если пароль не передан — запрашиваем его
        if (!password) {
          return {
            success: true,
            isAuthenticated: false,
            needsPassword: true,
            client, // Возвращаем клиент для повторного использования
          };
        }

        // Проверяем пароль 2FA (client точно определён здесь)
        if (!client) {
          return {
            success: false,
            error: 'Клиент не определён',
          };
        }

        try {
          console.log('🔐 Проверка 2FA пароля для QR...');

          // Получаем SRP параметры
          const passwordData = await client.invoke(new Api.account.GetPassword());

          // Импортируем функцию для вычисления SRP проверки
          const { computeCheck } = await import('telegram/Password');

          // Вычисляем SRP проверку
          const passwordCheck = await computeCheck(passwordData, password);

          // Проверяем пароль
          await client.invoke(new Api.auth.CheckPassword({ password: passwordCheck }));

          console.log('✅ 2FA пароль проверен для QR');

          // После успешной проверки пароля — ПОВТОРНО вызываем exportLoginToken для получения сессии
          console.log('🔄 Повторный exportLoginToken после проверки 2FA...');
          const finalResult = await client.invoke(
            new Api.auth.ExportLoginToken({
              apiId: parseInt(apiId),
              apiHash,
              exceptIds: [],
            })
          );

          // После проверки пароля должен вернуться LoginTokenSuccess
          if (finalResult instanceof Api.auth.LoginTokenSuccess) {
            const sessionString = client.session.save();
            console.log('✅ QR отсканирован с 2FA!');
            console.log('📦 Session String:', sessionString);

            return {
              success: true,
              isAuthenticated: true,
              sessionString: String(sessionString),
              client, // Возвращаем клиент для отключения
            };
          }

          // Если вернулся LoginToken — значит ещё не отсканирован
          if (finalResult instanceof Api.auth.LoginToken) {
            console.log('⚠️ QR ещё не отсканирован после 2FA');
            return {
              success: true,
              isAuthenticated: false,
            };
          }

          return {
            success: false,
            error: 'Неожиданный результат после проверки пароля',
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

      // AUTH_TOKEN_EXPIRED означает, что токен был использован (importLoginToken вызывался ранее)
      // Это нормально для polling — просто продолжаем ждать
      if (error.message?.includes('AUTH_TOKEN_EXPIRED')) {
        console.log('ℹ️ Токен уже был проверен (AUTH_TOKEN_EXPIRED) — это нормально для polling');
        return {
          success: true,
          isAuthenticated: false, // Ждём пока пользователь отсканирует
          client, // Возвращаем клиент для повторного использования
        };
      }

      console.error('❌ Ошибка проверки QR:', error.message);
      return {
        success: false,
        error: error.message || 'Ошибка проверки QR',
        client, // Возвращаем клиент для повторного использования
      };
    }
    // finally убран — routes.ts сам управляет отключением клиента
  }
}

/**
 * Экспорт единственного экземпляра сервиса
 */
export const telegramAuthService = new TelegramAuthService();
