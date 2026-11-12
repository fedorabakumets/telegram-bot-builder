/** @fileoverview Чтение режимов ботов администратором с безопасными ошибками и запретом кеширования. */
import type { RequestHandler } from 'express';
import { parseWorkerBotQuery, type WorkerBotListQuery } from './worker-bot-request';

/** Создаёт проверяемый обработчик; неверные запросы не доходят до базы и исполнителя. */
export function createWorkerBotListHandler(collect: (query: WorkerBotListQuery) => Promise<unknown>): RequestHandler {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    const query = parseWorkerBotQuery(request.query);
    if (!query.success) { response.status(400).json({ message: 'Проверьте поиск, режим и номер страницы' }); return; }
    try { response.json(await collect(query.data)); }
    catch { response.status(503).json({ message: 'Не удалось получить режимы ботов. Повторите попытку' }); }
  };
}
