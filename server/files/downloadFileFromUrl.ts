/**
 * @fileoverview Потоковая загрузка внешнего файла с ограничением размера и защитой от SSRF.
 */
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { safeExternalRequest } from '../utils/safe-external-request';

/** Загружает разрешённый внешний файл во временный путь.
 * @param url - Адрес файла
 * @param destination - Путь назначения
 * @returns Размер и тип файла либо ошибка
 */
export async function downloadFileFromUrl(url: string, destination: string): Promise<{ success: boolean; filePath?: string; size?: number; mimeType?: string; fileName?: string; error?: string }> {
  try {
    const result = await safeExternalRequest(url, 'GET');
    const response = result.response;
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      response.resume();
      throw new Error(`Ошибка сервера: ${response.statusCode}`);
    }
    const mimeType = response.headers['content-type'] || 'application/octet-stream';
    const limit = (mimeType.startsWith('video/') ? 200 : 50) * 1024 * 1024;
    if (Number(response.headers['content-length']) > limit) { response.destroy(); throw new Error('Превышен допустимый размер файла'); }
    let size = 0;
    const limiter = new Transform({ transform(chunk, _encoding, callback) {
      size += chunk.length;
      callback(size > limit ? new Error('Превышен допустимый размер файла') : null, chunk);
    }});
    await pipeline(response, limiter, createWriteStream(destination));
    return { success: true, filePath: destination, size, mimeType, fileName: result.url.pathname.split('/').pop() || 'file' };
  } catch (error) {
    await unlink(destination).catch(() => {});
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка загрузки' };
  }
}
