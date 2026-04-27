/**
 * @fileoverview Zod-схема для шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.schema
 */

import { z } from 'zod';

/** Схема HTTP метода запроса */
export const httpRequestMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Схема типа аутентификации */
export const httpRequestAuthTypeSchema = z.enum(['none', 'basic', 'bearer', 'header', 'query']);

/** Схема формата тела запроса */
export const httpRequestBodyFormatSchema = z.enum(['json', 'form-urlencoded', 'raw']);

/** Схема формата ответа: autodetect, json, text или file (бинарный файл в base64) */
export const httpRequestResponseFormatSchema = z.enum(['autodetect', 'json', 'text', 'file']);

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
  /** Тип аутентификации */
  authType: httpRequestAuthTypeSchema.optional().default('none'),
  /** Bearer токен */
  authBearerToken: z.string().optional().default(''),
  /** Basic auth логин */
  authBasicUsername: z.string().optional().default(''),
  /** Basic auth пароль */
  authBasicPassword: z.string().optional().default(''),
  /** Имя заголовка для header auth */
  authHeaderName: z.string().optional().default(''),
  /** Значение заголовка для header auth */
  authHeaderValue: z.string().optional().default(''),
  /** Имя query параметра для query auth */
  authQueryName: z.string().optional().default(''),
  /** Значение query параметра для query auth */
  authQueryValue: z.string().optional().default(''),
  /** Query параметры в формате JSON строки [{key, value}] */
  queryParams: z.string().optional().default(''),
  /** Формат тела запроса */
  bodyFormat: httpRequestBodyFormatSchema.optional().default('json'),
  /** Формат ответа: autodetect, json, text или file (base64-объект) */
  responseFormat: httpRequestResponseFormatSchema.optional().default('autodetect'),
  /** Не падать при HTTP ошибках 4xx/5xx */
  ignoreHttpErrors: z.boolean().optional().default(false),
  /** Игнорировать SSL сертификат */
  ignoreSsl: z.boolean().optional().default(false),
  /** Следовать редиректам */
  followRedirects: z.boolean().optional().default(true),
  /** Включить пагинацию */
  enablePagination: z.boolean().optional().default(false),
  /** Режим пагинации: interactive — кнопки Далее/Назад, fetch_all — собрать все страницы */
  paginationMode: z.enum(['interactive', 'fetch_all']).optional().default('interactive'),
  /** Имя переменной offset для интерактивной пагинации */
  paginationOffsetVar: z.string().optional().default(''),
  /** Поле с общим количеством записей в ответе API */
  paginationTotalField: z.string().optional().default('count'),
  /** Поле с массивом элементов в ответе API */
  paginationItemsField: z.string().optional().default('items'),
  /** Количество элементов на страницу */
  paginationLimit: z.number().optional().default(10),
  /** Максимальное количество страниц для режима fetch_all */
  paginationMaxPages: z.number().optional().default(20),
});

/** Тип параметров шаблона http_request */
export type HttpRequestParams = z.infer<typeof httpRequestParamsSchema>;
