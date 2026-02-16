/**
 * @fileoverview Модуль для проверки доступности URL-адресов
 *
 * Этот файл предоставляет функции для проверки доступности URL-адресов,
 * включая информацию о типе содержимого, размере и имени файла.
 */

import http from "http";
import https from "https";
import { URL } from "node:url";

/**
 * Проверяет доступность URL-адреса
 *
 * @param url - URL-адрес для проверки
 * @returns Promise объект с информацией о доступности URL:
 * - accessible: флаг доступности URL
 * - mimeType: MIME-тип содержимого (если доступно)
 * - size: размер содержимого в байтах (если доступно)
 * - fileName: имя файла (если можно определить)
 * - error: сообщение об ошибке (если произошла ошибка)
 */
export async function checkUrlAccessibility(url: string): Promise<{
  accessible: boolean;
  mimeType?: string | undefined;
  size?: number | undefined;
  fileName?: string | undefined;
  error?: string | undefined;
}> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return resolve({ accessible: false, error: 'Поддерживаются только HTTP и HTTPS ссылки' });
      }

      const client = parsedUrl.protocol === 'https:' ? https : http;

      const request = client.request(url, { method: 'HEAD', timeout: 10000 }, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return checkUrlAccessibility(response.headers.location).then(resolve);
        }

        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
          return resolve({
            accessible: false,
            error: `Ошибка сервера: ${response.statusCode} ${response.statusMessage}`
          });
        }

        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = response.headers['content-disposition'];

        let fileName = '';
        if (contentDisposition && contentDisposition.includes('filename=')) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }

        if (!fileName) {
          fileName = parsedUrl.pathname.split('/').pop() || 'file';
        }

        resolve({
          accessible: true,
          mimeType: contentType,
          size: contentLength ? parseInt(contentLength) : undefined,
          fileName: fileName
        });
      });

      request.on('error', (error) => {
        resolve({ accessible: false, error: `Ошибка сети: ${error.message}` });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ accessible: false, error: 'Превышено время ожидания' });
      });

      request.end();

    } catch (error) {
      resolve({
        accessible: false,
        error: error instanceof Error ? error.message : 'Неверный URL'
      });
    }
  });
}
