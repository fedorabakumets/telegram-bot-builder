/** @fileoverview Ограниченное чтение ответов Telegram без раскрытия адресов с токенами. */

/**
 * Читает тело ответа с ограничением размера и отменой по общему сроку.
 * @param response - Ответ транспорта
 * @param limit - Максимальное число байт
 * @param signal - Общий сигнал отмены
 * @returns Буфер ответа
 */
export async function readPhotoResponse(response: Response, limit: number, signal: AbortSignal): Promise<Buffer> {
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Недопустимый ответ сервиса фотографий');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  /** Прерывает ожидание тела при истечении общего срока. */
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) throw new Error('Фотография превышает допустимый размер');
      chunks.push(chunk.value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/**
 * Проверяет относительный путь Telegram и кодирует его сегменты.
 * @param path - Путь из ответа getFile
 * @returns Безопасный относительный путь
 */
export function encodePhotoFilePath(path: unknown): string {
  if (typeof path !== 'string' || path.length > 2048 || !/^[A-Za-z0-9_./-]+$/.test(path)
    || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Недопустимый путь фотографии');
  }
  return path.split('/').map(encodeURIComponent).join('/');
}
