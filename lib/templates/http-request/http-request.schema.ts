/**
 * @fileoverview Zod-схема для шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.schema
 */

import { z } from 'zod';

/** Схема HTTP метода запроса */
export const httpRequestMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Схема параметров шаблона http_request */
export const httpRequestParamsSchema = z.object({
  /** Уникальный идентификатор узла */
  nodeId: z.string().min(1),
  /** Безопасное имя функции (без спецсимволов) */
  safeName: z.string().min(1),
  /** URL запроса */
  url: z.string().optional().default(''),
  /** HTTP метод */
  method: httpRequestMethodSchema.optional().default('GET'),
  /** JSON строка с заголовками */
  headers: z.string().optional().default(''),
  /** JSON строка с телом запроса */
  body: z.string().optional().default(''),
  /** Таймаут в секундах */
  timeout: z.number().optional().default(30),
  /** Имя переменной для сохранения ответа */
  responseVariable: z.string().optional().default('response'),
  /** Имя переменной для HTTP статус кода */
  statusVariable: z.string().optional().default(''),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional().default(''),
  /** Существует ли целевой узел автоперехода */
  autoTransitionTargetExists: z.boolean().optional().default(false),
});

/** Тип параметров шаблона http_request */
export type HttpRequestParams = z.infer<typeof httpRequestParamsSchema>;
