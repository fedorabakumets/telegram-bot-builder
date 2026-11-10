/** @fileoverview Безопасное завершение HTTP-запроса при необработанной ошибке API. */
import type { ErrorRequestHandler } from 'express';

/**
 * Отвечает без внутренних сообщений БД и передаёт уже начатый ответ Express.
 * @param error - Ошибка обработчика запроса
 * @param _request - Запрос клиента
 * @param response - Ответ HTTP
 * @param next - Стандартная обработка уже начатого ответа
 * @returns Ничего после отправки ответа или передачи ошибки
 */
export const apiErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) { next(error); return; }
  const requested = Number(error?.status ?? error?.statusCode);
  const status = Number.isInteger(requested) && requested >= 400 && requested <= 599 ? requested : 500;
  if (status >= 500) {
    /** В журнал не попадают SQL, параметры запросов и строки подключения. */
    console.error('[API] Необработанная ошибка запроса', { status });
    response.set('Cache-Control', 'no-store');
  }
  const message = status >= 500 ? 'Внутренняя ошибка сервера' :
    typeof error?.message === 'string' ? error.message : 'Ошибка запроса';
  response.status(status).json({ message });
};
