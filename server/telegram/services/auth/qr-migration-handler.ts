/**
 * @fileoverview Обработчик миграции Telegram DC при генерации QR
 * @module server/telegram/services/auth/qr-migration-handler
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import {
  QR_MIGRATING_DC,
  QR_REEXPORTING_TOKEN
} from './qr-error-messages.js';

/**
 * Результат обработки миграции
 */
export interface MigrationResult {
  /** Требуется ли миграция */
  needsMigration: boolean;
  /** DC ID для миграции */
  dcId?: number;
}

/**
 * Проверяет, требует ли результат миграции на другой DC
 *
 * @param result - Результат вызова API
 * @returns Информация о миграции
 */
export function checkMigrationNeeded(result: unknown): MigrationResult {
  if (result instanceof Api.auth.LoginTokenMigrateTo) {
    return {
      needsMigration: true,
      dcId: result.dcId,
    };
  }

  return {
    needsMigration: false,
  };
}

/**
 * Выполняет миграцию клиента на указанный DC и повторно генерирует QR-токен
 *
 * @param client - Клиент Telegram для миграции
 * @param dcId - ID дата-центра для миграции
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @returns Новый QR-токен после миграции
 */
export async function handleQRMigration(
  client: TelegramClient,
  dcId: number,
  apiId: string,
  apiHash: string
): Promise<{ token: string; qrUrl: string; expires: number }> {
  console.log(QR_MIGRATING_DC, dcId);

  // Мигрируем на нужный DC
  await client._switchDC(dcId);

  // Ждём немного после миграции
  await new Promise(resolve => setTimeout(resolve, 500));

  // Повторяем экспорт токена на новом DC
  console.log(QR_REEXPORTING_TOKEN);

  const result = await client.invoke(
    new Api.auth.ExportLoginToken({
      apiId: parseInt(apiId),
      apiHash,
      exceptIds: [],
    })
  );

  if (result instanceof Api.auth.LoginToken) {
    const tokenBase64 = Buffer.from(result.token).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = result.expires - now;

    return {
      token: Buffer.from(result.token).toString('base64'),
      qrUrl: `tg://login?token=${tokenBase64}`,
      expires: expiresInSeconds,
    };
  }

  // Если снова миграция — рекурсивно обрабатываем
  if (result instanceof Api.auth.LoginTokenMigrateTo) {
    return await handleQRMigration(client, result.dcId, apiId, apiHash);
  }

  throw new Error('Неожиданный результат после миграции');
}
