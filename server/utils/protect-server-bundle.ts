/** @fileoverview Запрет HTTP-доступа к серверным артефактам внутри клиентского dist. */
import { posix } from "node:path";
import type { RequestHandler } from "express";

/**
 * Проверяет декодированный путь до express.static, включая обход через сегменты пути.
 * @param request - HTTP-запрос
 * @param response - HTTP-ответ
 * @param next - Передача обработки следующему middleware
 */
export const protectServerBundle: RequestHandler = (request, response, next) => {
  try {
    const normalized = posix.normalize(decodeURIComponent(request.path).replace(/\\/g, "/"));
    if (/^\/server(?:\/|$)/i.test(normalized)) {
      response.sendStatus(404);
      return;
    }
    next();
  } catch {
    response.sendStatus(400);
  }
};
