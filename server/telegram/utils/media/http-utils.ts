/**
 * @fileoverview Утилиты для HTTP-запросов к Telegram API
 * @module server/telegram/utils/http-utils
 */

import https from 'https';
import type { TelegramFileInfo } from '../../types/media/telegram-file-info.js';
import type { HttpTimeoutOptions } from '../../types/media/http-request.js';

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
  const maskedToken = botToken.length > 12 ? `${botToken.slice(0, 8)}...${botToken.slice(-4)}` : '***';
  const startTime = Date.now();
  
  console.log(`[Telegram Media] Getting file info for ${fileId}, token: ${maskedToken}`);
  
  const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;

  try {
    const response = await httpsGet<any>({ url: getFileUrl, timeout: 10000 });
    
    console.log(`[Telegram Media] File info received in ${Date.now() - startTime}ms: ${response.result?.file_path || 'unknown'}`);

    if (!response.ok) {
      console.warn(`[Telegram Media] File info error for ${fileId}: ${response.description || 'Unknown error'}`);
      throw new Error(`Ошибка Telegram API: ${response.description || 'Неизвестная ошибка'}`);
    }

    return response.result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Telegram Media] Failed to get file info for ${fileId}:`);
    console.error(`  - Error: ${errorMessage}`);
    console.error(`  - Time: ${Date.now() - startTime}ms`);
    throw error;
  }
}
