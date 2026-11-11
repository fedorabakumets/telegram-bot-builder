/** @fileoverview Ограниченное чтение метаданных и безопасный путь файла Telegram. */
/** Читает небольшой JSON с отменой и ограничением фактического размера.
 * @param response - Ответ Telegram.
 * @param signal - Сигнал отмены запроса.
 * @returns Относительный путь файла.
 */
export async function readTelegramFilePath(response: Response, signal: AbortSignal): Promise<string> {
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > 262144) {
    await response.body?.cancel();
    throw new Error('Недопустимые метаданные файла');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  /** Отменяет чтение тела при отключении клиента или истечении срока. */
  const abort = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 262144) throw new Error('Метаданные файла слишком велики');
      chunks.push(part.value);
    }
    const data = JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
    if (data?.ok !== true) throw new Error('Файл недоступен');
    const path = data.result?.file_path;
    if (typeof path !== 'string' || path.length > 2048 || !/^[A-Za-z0-9_./-]+$/.test(path)
      || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Недопустимый путь файла');
    return path;
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
