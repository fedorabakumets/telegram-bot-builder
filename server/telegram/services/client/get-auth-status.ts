/**
 * @fileoverview Проверка статуса авторизации пользователя
 * @module server/telegram/services/client/get-auth-status
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { db } from '../../../database/db.js';
import type { AuthStatusExtended } from '../../types/client/auth-status-extended.js';

/**
 * Получает статус авторизации пользователя
 * @param userId - ID пользователя
 * @returns Расширенный статус авторизации
 */
export async function getAuthStatus(userId: string): Promise<AuthStatusExtended> {
  try {
    const result = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return {
        isAuthenticated: false,
        needsCode: false,
        needsPassword: false,
        hasCredentials: false,
      };
    }

    const row = result[0];
    const hasCredentials = !!(row.apiId && row.apiHash);
    const hasSession = !!row.sessionString;

    if (hasSession && row.apiId && row.apiHash) {
      try {
        const client = new TelegramClient(
          new StringSession(row.sessionString ?? undefined),
          parseInt(row.apiId),
          row.apiHash ?? undefined,
          {
            connectionRetries: 5,
            useWSS: false,
            // Указываем информацию об устройстве для корректного отображения в Telegram
            appVersion: '1.0.0',
            deviceModel: 'Server Bot Builder',
            systemVersion: typeof process !== 'undefined' && process.platform ? (process.platform === 'win32' ? 'Windows_NT' : process.platform) : 'Unknown',
          }
        );

        await client.connect();
        const me = await client.getMe();

        // Не отключаем клиента — он может использоваться в других местах

        return {
          isAuthenticated: true,
          needsCode: false,
          needsPassword: false,
          hasCredentials: true,
          username: me?.username || undefined,
          phoneNumber: (me as any).phone || undefined,
          userId: (me as any).userId?.toString() || me?.id?.toString(),
        };
      } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        return {
          isAuthenticated: true,
          needsCode: false,
          needsPassword: false,
          hasCredentials: true,
        };
      }
    }

    return {
      isAuthenticated: false,
      needsCode: hasCredentials,
      needsPassword: false,
      hasCredentials,
    };
  } catch (error) {
    console.error('Ошибка проверки credentials:', error);
    return {
      isAuthenticated: false,
      needsCode: false,
      needsPassword: false,
      hasCredentials: false,
    };
  }
}
