/**
 * @fileoverview Экспорт модуля шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/index
 */

export type {
  HttpRequestTemplateParams,
  HttpRequestMethod,
} from './http-request.params';
export type { HttpRequestParams } from './http-request.schema';
export {
  httpRequestParamsSchema,
  httpRequestMethodSchema,
} from './http-request.schema';
export {
  generateHttpRequest,
  generateHttpRequestFromNode,
  nodeToHttpRequestParams,
} from './http-request.renderer';
export * from './http-request.fixture';
