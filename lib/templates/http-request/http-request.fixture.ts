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
