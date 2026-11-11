/** @fileoverview Защищённый поток Telegram с отменой и поддержкой Range без записи на диск. */
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';
import { getTelegramApiBaseUrl } from '../../../../utils/telegram-api-url';
import { fetchWithProxy } from '../../../../utils/telegram-proxy';
import { readTelegramFilePath } from './telegram-file-response';
import { setTelegramFileHeaders } from './telegram-file-headers';
/** Параметры файла после проверки доступа вызывающим обработчиком. */
export interface TelegramStreamInput {
  /** Секрет бота. */
  token: string;
  /** Проверенный идентификатор файла. */
  fileId: string;
  /** Предел размера аватара; для обычных медиа ограничение отсутствует. */
  maxBytes?: number;
  /** Общий срок передачи; для обычных медиа две минуты. */
  timeoutMs?: number;
}
/** Передаёт файл после проверки доступа вызывающим маршрутом.
 * @param req - Запрос браузера.
 * @param res - Потоковый ответ.
 * @param input - Проверенные токен и идентификатор файла.
 * @returns Завершение потока или ошибки.
 */
export async function streamTelegramFile(req: Request, res: Response, input: TelegramStreamInput): Promise<void> {
  const controller = new AbortController();
  /** Отменяет передачу при разрыве соединения. */
  const abort = () => controller.abort();
  const timer = setTimeout(abort, input.timeoutMs ?? 120_000);
  timer.unref();
  const metadataTimer = setTimeout(abort, 10_000);
  metadataTimer.unref();
  req.once('aborted', abort);
  res.once('close', abort);
  try {
    if (!/^\d{1,20}:[A-Za-z0-9_-]{20,100}$/.test(input.token)
      || typeof input.fileId !== 'string' || !input.fileId || input.fileId.length > 2048) throw new Error('Некорректные параметры');
    if (req.aborted || res.destroyed) return;
    const origin = getTelegramApiBaseUrl();
    const metadata = await fetchWithProxy(`${origin}/bot${input.token}/getFile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: input.fileId }), signal: controller.signal, redirect: 'error',
    });
    const path = await readTelegramFilePath(metadata, controller.signal);
    clearTimeout(metadataTimer);
    const headers: Record<string, string> = {};
    if (req.headers.range) headers.Range = req.headers.range;
    const upstream = await fetchWithProxy(`${origin}/file/bot${input.token}/${path}`, {
      headers, signal: controller.signal, redirect: 'error',
    });
    if (upstream.status === 416) {
      await upstream.body?.cancel();
      const range = upstream.headers.get('content-range');
      if (range) res.set('Content-Range', range);
      res.status(416).end(); return;
    }
    if (![200, 206].includes(upstream.status) || !upstream.body) {
      await upstream.body?.cancel();
      res.status(404).json({ message: 'Не удалось получить файл' }); return;
    }
    if (input.maxBytes !== undefined && Number(upstream.headers.get('content-length')) > input.maxBytes) {
      await upstream.body.cancel();
      throw new Error('Файл превышает допустимый размер');
    }
    setTelegramFileHeaders(req, res, upstream, path);
    const source = Readable.fromWeb(upstream.body as never);
    if (input.maxBytes === undefined) {
      await pipeline(source, res, { signal: controller.signal });
    } else {
      let bytes = 0;
      const bounded = new Transform({
        /** Проверяет реальный размер каждого фрагмента до отправки браузеру.
         * @param chunk - Фрагмент потока.
         * @param _encoding - Кодировка фрагмента.
         * @param callback - Завершение обработки.
         */
        transform(chunk, _encoding, callback) {
          bytes += chunk.length;
          callback(bytes > input.maxBytes! ? new Error('Файл слишком велик') : null, chunk);
        },
      });
      await pipeline(source, bounded, res, { signal: controller.signal });
    }
  } catch {
    if (!res.headersSent && !res.destroyed) {
      res.status(controller.signal.aborted ? 504 : 502).json({ message: 'Не удалось получить файл' });
    } else if (!res.destroyed) res.destroy();
  } finally {
    clearTimeout(timer);
    clearTimeout(metadataTimer);
    req.removeListener('aborted', abort);
    res.removeListener('close', abort);
    controller.abort();
  }
}
