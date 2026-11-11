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
      if (size > limit) throw new Error('Ответ превышает допустимый размер');
      chunks.push(chunk.value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
