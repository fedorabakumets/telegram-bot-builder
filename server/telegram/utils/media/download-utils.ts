/**
 * @fileoverview Утилиты для скачивания файлов по URL
 * @module server/telegram/utils/download-utils
 */

import https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Скачивает файл по URL и сохраняет в указанное место
 * @param url - URL для скачивания
 * @param destination - Путь для сохранения файла
 * @param timeout - Таймаут в миллисекундах (по умолчанию 30000)
 * @throws Error при ошибке скачивания или таймауте
 */
export async function downloadFile(
  url: string,
  destination: string,
  timeout = 30000
): Promise<void> {
  const startTime = Date.now();
  const maskedUrl = url.replace(/bot[^/]+\//, 'bot***/');
  
  console.log(`[Telegram Media] Downloading file: ${maskedUrl}`);
  
  return new Promise<void>((resolve, reject) => {
    const request = https.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) {
        console.error(`[Telegram Media] Download failed: HTTP ${res.statusCode}`);
        reject(new Error(`Не удалось скачать файл: HTTP ${res.statusCode}`));
        return;
      }

      console.log(`[Telegram Media] Download started, status: ${res.statusCode}`);

      const fileStream = createWriteStream(destination);
      pipeline(res, fileStream)
        .then(() => {
          console.log(`[Telegram Media] Download completed in ${Date.now() - startTime}ms`);
          resolve();
        })
        .catch((err) => {
          console.error(`[Telegram Media] Download pipeline error: ${err.message}`);
          reject(err);
        });
    }).on('error', (err) => {
      console.error(`[Telegram Media] Download error: ${err.message}`);
      reject(err);
    });

    request.on('timeout', () => {
      console.error(`[Telegram Media] Download timeout after ${timeout}ms`);
      request.destroy();
      reject(new Error('Таймаут запроса'));
    });
  });
}
