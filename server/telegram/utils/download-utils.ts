/**
 * @fileoverview Утилиты для скачивания файлов по URL
 * @module server/telegram/utils/download-utils
 */

import https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import type { HttpTimeoutOptions } from '../types/http-request.js';

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
  return new Promise<void>((resolve, reject) => {
    const request = https.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Не удалось скачать файл: HTTP ${res.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(destination);
      pipeline(res, fileStream)
        .then(() => resolve())
        .catch(reject);
    }).on('error', reject);

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Таймаут запроса'));
    });
  });
}
