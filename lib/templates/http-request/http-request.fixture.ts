/**
 * @fileoverview Тестовые данные для шаблона http-request.
 * @module templates/http-request/http-request.fixture
 */

import type { Node } from '@shared/schema';
import type { HttpRequestTemplateParams } from './http-request.params';

/** Параметры: простой GET запрос */
export const validParamsGet: HttpRequestTemplateParams = {
  nodeId: 'http_request_1',
  safeName: 'http_request_1',
  url: 'https://api.example.com/data',
  method: 'GET',
  timeout: 30,
  responseVariable: 'response',
};

/** Параметры: POST запрос с телом */
export const validParamsPost: HttpRequestTemplateParams = {
  nodeId: 'http_request_2',
  safeName: 'http_request_2',
  url: 'https://api.example.com/users',
  method: 'POST',
  body: '{"name": "test", "email": "test@example.com"}',
  timeout: 30,
  responseVariable: 'create_response',
};

/** Параметры: запрос с заголовками */
export const validParamsWithHeaders: HttpRequestTemplateParams = {
  nodeId: 'http_request_3',
  safeName: 'http_request_3',
  url: 'https://api.example.com/protected',
  method: 'GET',
  headers: '{"Authorization": "Bearer token123", "Content-Type": "application/json"}',
  timeout: 15,
  responseVariable: 'protected_response',
};

/** Параметры: с сохранением статус кода */
export const validParamsWithStatus: HttpRequestTemplateParams = {
  nodeId: 'http_request_4',
  safeName: 'http_request_4',
  url: 'https://api.example.com/check',
  method: 'GET',
  timeout: 10,
  responseVariable: 'check_response',
  statusVariable: 'http_status',
};

/** Параметры: URL с переменной {city} */
export const validParamsWithVariables: HttpRequestTemplateParams = {
  nodeId: 'http_request_5',
  safeName: 'http_request_5',
  url: 'https://api.weather.com/v1/current?city={city}&units=metric',
  method: 'GET',
  timeout: 30,
  responseVariable: 'weather_data',
};

/** Параметры: Bearer аутентификация */
export const validParamsBearer: HttpRequestTemplateParams = {
  nodeId: 'http_request_bearer',
  safeName: 'http_request_bearer',
  url: 'https://api.example.com/me',
  method: 'GET',
  authType: 'bearer',
  authBearerToken: 'mytoken123',
  timeout: 30,
  responseVariable: 'me_response',
};

/** Параметры: Basic аутентификация */
export const validParamsBasic: HttpRequestTemplateParams = {
  nodeId: 'http_request_basic',
  safeName: 'http_request_basic',
  url: 'https://api.example.com/secure',
  method: 'GET',
  authType: 'basic',
  authBasicUsername: 'admin',
  authBasicPassword: 'secret',
  timeout: 30,
  responseVariable: 'secure_response',
};

/** Параметры: с query параметрами */
export const validParamsWithQueryParams: HttpRequestTemplateParams = {
  nodeId: 'http_request_qp',
  safeName: 'http_request_qp',
  url: 'https://api.example.com/search',
  method: 'GET',
  queryParams: '[{"key":"q","value":"test"},{"key":"limit","value":"10"}]',
  timeout: 30,
  responseVariable: 'search_response',
};

/** Параметры: form-urlencoded тело */
export const validParamsFormEncoded: HttpRequestTemplateParams = {
  nodeId: 'http_request_form',
  safeName: 'http_request_form',
  url: 'https://api.example.com/submit',
  method: 'POST',
  bodyFormat: 'form-urlencoded',
  body: 'name=test&email=test@example.com',
  timeout: 30,
  responseVariable: 'submit_response',
};

/** Параметры: игнорировать SSL и ошибки, без редиректов */
export const validParamsIgnoreErrors: HttpRequestTemplateParams = {
  nodeId: 'http_request_ignore',
  safeName: 'http_request_ignore',
  url: 'https://self-signed.example.com/api',
  method: 'GET',
  ignoreSsl: true,
  ignoreHttpErrors: true,
  followRedirects: false,
  timeout: 30,
  responseVariable: 'ignore_response',
};

/** Параметры: URL с dot-notation переменной {validate_response.result.user_id} */
export const validParamsWithDotNotationUrl: HttpRequestTemplateParams = {
  nodeId: 'http_request_dot_url',
  safeName: 'http_request_dot_url',
  url: 'https://api.example.com/users/{validate_response.result.user_id}/profile',
  method: 'GET',
  timeout: 30,
  responseVariable: 'profile_data',
};

/** Параметры: тело с dot-notation переменной {validate_response.result.first_name} */
export const validParamsWithDotNotationBody: HttpRequestTemplateParams = {
  nodeId: 'http_request_dot_body',
  safeName: 'http_request_dot_body',
  url: 'https://api.example.com/update',
  method: 'POST',
  body: '{"first_name": "{validate_response.result.first_name}", "email": "{user.email}"}',
  timeout: 30,
  responseVariable: 'update_result',
};

/** Узел графа: GET запрос */
export const httpRequestNodeGet: Node = {
  id: 'http_request_1',
  type: 'http_request',
  position: { x: 0, y: 0 },
  data: {
    httpRequestUrl: 'https://api.example.com/data',
    httpRequestMethod: 'GET',
    httpRequestTimeout: 30,
    httpRequestResponseVariable: 'response',
  } as any,
};

/** Узел графа: POST запрос с телом */
export const httpRequestNodePost: Node = {
  id: 'http_request_2',
  type: 'http_request',
  position: { x: 0, y: 0 },
  data: {
    httpRequestUrl: 'https://api.example.com/users',
    httpRequestMethod: 'POST',
    httpRequestBody: '{"name": "test"}',
    httpRequestTimeout: 30,
    httpRequestResponseVariable: 'create_response',
  } as any,
};

/** Параметры: интерактивная пагинация */
export const validParamsInteractivePagination: HttpRequestTemplateParams = {
  nodeId: 'fetch_users',
  safeName: 'fetch_users',
  url: 'https://api.example.com/users?limit=10&offset={users_offset}',
  method: 'GET',
  timeout: 30,
  responseVariable: 'users_data',
  enablePagination: true,
  paginationMode: 'interactive',
  paginationOffsetVar: 'users_offset',
  paginationTotalField: 'count',
  paginationItemsField: 'items',
  paginationLimit: 10,
};

/** Параметры: режим fetch_all */
export const validParamsFetchAll: HttpRequestTemplateParams = {
  nodeId: 'fetch_all_tracks',
  safeName: 'fetch_all_tracks',
  url: 'https://api.example.com/tracks',
  method: 'GET',
  timeout: 30,
  responseVariable: 'tracks_data',
  enablePagination: true,
  paginationMode: 'fetch_all',
  paginationTotalField: 'total',
  paginationItemsField: 'items',
  paginationLimit: 50,
  paginationMaxPages: 10,
};

/** Параметры: формат ответа file (base64) */
export const validParamsFileFormat: HttpRequestTemplateParams = {
  nodeId: 'http_request_file',
  safeName: 'http_request_file',
  url: 'https://api.example.com/export/project.json',
  method: 'GET',
  timeout: 30,
  responseVariable: 'export_file',
  responseFormat: 'file',
};

/** Узел графа: интерактивная пагинация */
export const httpRequestNodePagination: Node = {
  id: 'fetch_users',
  type: 'http_request',
  position: { x: 0, y: 0 },
  data: {
    httpRequestUrl: 'https://api.example.com/users?limit=10&offset={users_offset}',
    httpRequestMethod: 'GET',
    httpRequestTimeout: 30,
    httpRequestResponseVariable: 'users_data',
    httpRequestEnablePagination: true,
    httpRequestPaginationMode: 'interactive',
    httpRequestPaginationOffsetVar: 'users_offset',
    httpRequestPaginationTotalField: 'count',
    httpRequestPaginationItemsField: 'items',
    httpRequestPaginationLimit: 10,
  } as any,
};
