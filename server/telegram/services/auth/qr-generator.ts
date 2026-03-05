/**
 * @fileoverview Генератор QR-кодов для авторизации Telegram
 * @module server/telegram/services/auth/qr-generator
 */

import type { TelegramClient } from 'telegram';
import type { GenerateQRResult } from '../../types/auth/generate-qr-result.js';
import type { GenerateQRTokenResult } from '../../types/auth/generate-qr-token-result.js';
import { generateBasicQR } from './qr-basic-generator.js';
import { generateQRTokenWithExpiry } from './qr-token-generator.js';

/**
 * Генерирует QR-код для авторизации в Telegram
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @returns Результат генерации с QR URL и токеном
 */
export async function generateQR(
  apiId: string,
  apiHash: string
): Promise<GenerateQRResult> {
  return generateBasicQR(apiId, apiHash);
}

/**
 * Генерирует QR-токен с информацией о времени жизни
 *
 * @param client - Подключенный клиент Telegram
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @returns Результат с токеном, QR URL и временем жизни
 */
export async function generateQRToken(
  client: TelegramClient,
  apiId: string,
  apiHash: string
): Promise<GenerateQRTokenResult> {
  return generateQRTokenWithExpiry(client, apiId, apiHash);
}
