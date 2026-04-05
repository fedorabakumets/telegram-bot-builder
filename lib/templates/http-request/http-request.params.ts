/**
 * @fileoverview Параметры шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.params
 */

/** HTTP метод запроса */
export type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Параметры шаблона http_request */
export interface HttpRequestTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Безопасное имя функции (без спецсимволов) */
  safeName: string;
  /** URL запроса, поддерживает переменные {var} */
  url?: string;
  /** HTTP метод */
  method?: HttpRequestMethod;
  /** JSON строка с заголовками */
  headers?: string;
  /** JSON строка с телом запроса */
  body?: string;
  /** Таймаут в секундах */
  timeout?: number;
  /** Имя переменной для сохранения ответа */
  responseVariable?: string;
  /** Имя переменной для HTTP статус кода */
  statusVariable?: string;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** Существует ли целевой узел автоперехода */
  autoTransitionTargetExists?: boolean;
}
