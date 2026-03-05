/**
 * @fileoverview Утилиты для HTTP-запросов к Telegram API
 * @module server/telegram/utils/http-utils
 */

import https from 'https';
import type { TelegramFileInfo } from '../types/telegram-file-info.js';
import type { HttpTimeoutOptions } from '../types/http-request.js';

/**
 * Выполняет HTTPS GET-запрос с таймаутом
 * @param options - Опции запроса (URL и таймаут)
 * @returns Promise с данными ответа
 * @throws Error при ошибке запроса или таймауте
 */
export function httpsGet<T>(options: HttpTimeoutOptions): Promise<T> {
  const { url, timeout = 30000 } = options;

  return new Promise<T>((resolve, reject) => {
    const request = https.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Таймаут запроса'));
    });
  });
}

/**
 * Получает информацию о файле из Telegram Bot API
 * @param botToken - Токен бота
 * @param fileId - file_id файла
 * @returns Информация о файле (file_path, file_size)
 * @throws Error при ошибке Telegram API
 */
export async function getTelegramFileInfo(
  botToken: string,
  fileId: string
): Promise<TelegramFileInfo> {
  const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;

  const response = await httpsGet<any>({ url: getFileUrl });

  if (!response.ok) {
    throw new Error(`Ошибка Telegram API: ${response.description || 'Неизвестная ошибка'}`);
  }

  return response.result;
}
