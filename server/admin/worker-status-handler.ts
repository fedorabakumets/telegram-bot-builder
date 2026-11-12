/** @fileoverview Безопасная HTTP-выдача состояния воркеров без кеширования браузером. */
import type { RequestHandler } from 'express';

/** Создаёт обработчик с подменяемым сборщиком для адресной проверки ошибок. */
export function createWorkerStatusHandler(collect: () => Promise<unknown>): RequestHandler {
  return async (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    try { response.json(await collect()); }
    catch { response.status(500).json({ message: 'Не удалось получить состояние воркеров' }); }
  };
}
