import http from "http";
import https from "https";
import { createWriteStream, existsSync, unlinkSync } from "node:fs";
import { URL } from "node:url";

// Функция для загрузки файла по URL с улучшенной обработкой ошибок
export async function downloadFileFromUrl(url: string, destination: string): Promise<{
  success: boolean;
  filePath?: string;
  size?: number;
  mimeType?: string;
  fileName?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      // Проверяем корректность URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return resolve({ success: false, error: 'Поддерживаются только HTTP и HTTPS ссылки' });
      }

      // Выбираем модуль для загрузки в зависимости от протокола
      const client = parsedUrl.protocol === 'https:' ? https : http;

      // Создаем запрос с заголовками для эмуляции браузера
      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        },
        timeout: 30000 // 30 секунд таймаут
      }, (response) => {
        // Обрабатываем редиректы
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = response.headers.location;
          console.log(`Редирект с ${url} на ${redirectUrl}`);
          return downloadFileFromUrl(redirectUrl, destination).then(resolve);
        }

        // Проверяем статус код
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
          return resolve({
            success: false,
            error: `Ошибка сервера: ${response.statusCode} ${response.statusMessage}`
          });
        }

        // Получаем информацию о файле из заголовков
        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = response.headers['content-disposition'];

        // Извлекаем имя файла из заголовков или URL
        let fileName = '';
        if (contentDisposition && contentDisposition.includes('filename=')) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }

        if (!fileName) {
          fileName = parsedUrl.pathname.split('/').pop() || 'downloaded-file';
          if (!fileName.includes('.')) {
            // Добавляем расширение на основе MIME типа
            const extensions = {
              'image/jpeg': '.jpg',
              'image/png': '.png',
              'image/gif': '.gif',
              'image/webp': '.webp',
              'video/mp4': '.mp4',
              'video/webm': '.webm',
              'audio/mpeg': '.mp3',
              'audio/wav': '.wav',
              'application/pdf': '.pdf',
              'text/plain': '.txt'
            };
            fileName += extensions[contentType as keyof typeof extensions] || '.bin';
          }
        }

        // Проверяем размер файла
        if (contentLength) {
          const fileSizeBytes = parseInt(contentLength);
          const maxSize = contentType.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
          if (fileSizeBytes > maxSize) {
            return resolve({
              success: false,
              error: `Файл слишком большой: ${Math.round(fileSizeBytes / (1024 * 1024))}МБ. Максимальный размер: ${Math.round(maxSize / (1024 * 1024))}МБ`
            });
          }
        }

        // Создаем поток для записи файла
        const fileStream = createWriteStream(destination);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          // Проверяем размер во время загрузки
          const maxSize = contentType.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
          if (downloadedBytes > maxSize) {
            response.destroy();
            fileStream.destroy();
            if (existsSync(destination)) {
              unlinkSync(destination);
            }
            return resolve({
              success: false,
              error: `Файл слишком большой: превышен лимит ${Math.round(maxSize / (1024 * 1024))}МБ`
            });
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          resolve({
            success: true,
            filePath: destination,
            size: downloadedBytes,
            mimeType: contentType,
            fileName: fileName
          });
        });

        fileStream.on('error', (error) => {
          if (existsSync(destination)) {
            unlinkSync(destination);
          }
          resolve({ success: false, error: `Ошибка записи файла: ${error.message}` });
        });
      });

      request.on('error', (error) => {
        resolve({ success: false, error: `Ошибка сети: ${error.message}` });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ success: false, error: 'Превышено время ожидания (30 секунд)' });
      });

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  });
}
