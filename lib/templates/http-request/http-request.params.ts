/**
 * @fileoverview Параметры шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.params
 */

/** HTTP метод запроса */
export type HttpRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Тип аутентификации */
export type HttpRequestAuthType = 'none' | 'basic' | 'bearer' | 'header' | 'query';

/** Формат тела запроса */
export type HttpRequestBodyFormat = 'json' | 'form-urlencoded' | 'raw';

/** Формат ответа: autodetect — автоопределение, json — JSON, text — текст, file — бинарный файл в base64 */
export type HttpRequestResponseFormat = 'autodetect' | 'json' | 'text' | 'file';

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
  /** Тип аутентификации: none, basic, bearer, header, query */
  authType?: HttpRequestAuthType;
  /** Bearer токен */
  authBearerToken?: string;
  /** Basic auth логин */
  authBasicUsername?: string;
  /** Basic auth пароль */
  authBasicPassword?: string;
  /** Имя заголовка для header auth */
  authHeaderName?: string;
  /** Значение заголовка для header auth */
  authHeaderValue?: string;
  /** Имя query параметра для query auth */
  authQueryName?: string;
  /** Значение query параметра для query auth */
  authQueryValue?: string;
  /** Query параметры в формате JSON строки [{key, value}] */
  queryParams?: string;
  /** Формат тела запроса: json, form-urlencoded, raw */
  bodyFormat?: HttpRequestBodyFormat;
  /** Формат ответа: autodetect, json, text или file (base64-объект) */
  responseFormat?: HttpRequestResponseFormat;
  /** Не падать при HTTP ошибках 4xx/5xx */
  ignoreHttpErrors?: boolean;
  /** Игнорировать SSL сертификат */
  ignoreSsl?: boolean;
  /** Следовать редиректам */
  followRedirects?: boolean;
  /** Включить пагинацию */
  enablePagination?: boolean;
  /** Режим пагинации: interactive — кнопки Далее/Назад, fetch_all — собрать все страницы */
  paginationMode?: 'interactive' | 'fetch_all';
  /** Имя переменной offset для интерактивной пагинации */
  paginationOffsetVar?: string;
  /** Поле с общим количеством записей в ответе API */
  paginationTotalField?: string;
  /** Поле с массивом элементов в ответе API */
  paginationItemsField?: string;
  /** Количество элементов на страницу */
  paginationLimit?: number;
  /** Максимальное количество страниц для режима fetch_all */
  paginationMaxPages?: number;
}
