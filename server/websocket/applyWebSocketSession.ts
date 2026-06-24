/**
 * @fileoverview Надёжное прикрепление Express-сессии к WebSocket upgrade-запросу.
 * Передаёт в session-middleware корректную заглушку response, чтобы middleware
 * не зависал (например при попытке записать в ответ) и гарантированно вызывал callback.
 * @module server/websocket/applyWebSocketSession
 */

import { exportedSessionMiddleware } from "../routes/routes";
import "express-session";

/**
 * Создаёт минимальную безопасную заглушку HTTP-response для session-middleware.
 * Все методы — no-op, чтобы middleware мог "обернуть" res.end/writeHead без падений.
 * @returns Объект-заглушка response
 */
function createResponseStub(): Record<string, unknown> {
  const stub: Record<string, unknown> = {
    /** Заголовок ответа уже не отправляется в WS-контексте */
    headersSent: false,
    /** Установка заголовка — no-op */
    setHeader: () => stub,
    /** Получение заголовка — всегда undefined */
    getHeader: () => undefined,
    /** Удаление заголовка — no-op */
    removeHeader: () => stub,
    /** Запись чанка — no-op */
    write: () => true,
    /** Завершение ответа — no-op */
    end: () => stub,
    /** Отправка заголовков статуса — no-op */
    writeHead: () => stub,
    /** Подписка на события — no-op */
    on: () => stub,
    /** Однократная подписка на события — no-op */
    once: () => stub,
    /** Снятие подписки — no-op */
    removeListener: () => stub,
    /** Излучение события — no-op */
    emit: () => false,
  };
  return stub;
}

/**
 * Прикрепляет Express-сессию к WebSocket upgrade-запросу.
 * После успешного резолва в request.session появляются данные сессии (включая telegramUser).
 * @param request - HTTP upgrade request WebSocket-соединения
 * @returns Промис, который резолвится после прикрепления сессии или реджектится при ошибке middleware
 */
export function applyWebSocketSession(request: unknown): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!exportedSessionMiddleware) {
      resolve();
      return;
    }
    const res = createResponseStub();
    exportedSessionMiddleware(request as never, res as never, (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
