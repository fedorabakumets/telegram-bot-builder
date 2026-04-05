/**
 * @fileoverview Рендерер шаблона http-request — HTTP запрос к внешнему API.
 * @module templates/http-request/http-request.renderer
 */

import type { Node } from '@shared/schema';
import type { HttpRequestTemplateParams, HttpRequestMethod } from './http-request.params';
import { httpRequestParamsSchema, httpRequestMethodSchema } from './http-request.schema';
import { renderPartialTemplate } from '../template-renderer';

/** Контекст всего графа для разрешения автоперехода */
export interface HttpRequestNodeContext {
  /** Все узлы графа для проверки существования целевого узла */
  allNodes?: Node[];
}

/**
 * Проверяет корректность HTTP метода.
 * @param value - проверяемое значение
 * @returns true, если значение является допустимым HttpRequestMethod
 */
function isHttpRequestMethod(value: unknown): value is HttpRequestMethod {
  return httpRequestMethodSchema.safeParse(value).success;
}

/**
 * Преобразует узел графа в параметры шаблона http_request.
 * @param node - узел графа бота
 * @param context - контекст графа (все узлы) для разрешения автоперехода
 * @returns параметры шаблона
 */
export function nodeToHttpRequestParams(node: Node, context?: HttpRequestNodeContext): HttpRequestTemplateParams {
  const data = node.data as any;
  const autoTransitionTo = typeof data?.autoTransitionTo === 'string'
    ? data.autoTransitionTo.trim()
    : '';
  const autoTransitionTargetExists = autoTransitionTo
    ? (context?.allNodes ?? []).some((n) => n.id === autoTransitionTo)
    : false;

  return {
    nodeId: node.id,
    safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
    url: typeof data?.httpRequestUrl === 'string' ? data.httpRequestUrl : '',
    method: isHttpRequestMethod(data?.httpRequestMethod) ? data.httpRequestMethod : 'GET',
    headers: typeof data?.httpRequestHeaders === 'string' ? data.httpRequestHeaders : '',
    body: typeof data?.httpRequestBody === 'string' ? data.httpRequestBody : '',
    timeout: typeof data?.httpRequestTimeout === 'number' ? data.httpRequestTimeout : 30,
    responseVariable: typeof data?.httpRequestResponseVariable === 'string' ? data.httpRequestResponseVariable : 'response',
    statusVariable: typeof data?.httpRequestStatusVariable === 'string' ? data.httpRequestStatusVariable : '',
    autoTransitionTo,
    autoTransitionTargetExists,
  };
}

/**
 * Генерирует Python-код из параметров шаблона http_request.
 * @param params - параметры шаблона
 * @returns сгенерированный Python-код
 */
export function generateHttpRequest(params: HttpRequestTemplateParams): string {
  const validated = httpRequestParamsSchema.parse(params);
  return renderPartialTemplate('http-request/http-request.py.jinja2', validated);
}

/**
 * Генерирует Python-код из узла графа.
 * @param node - узел графа бота
 * @param context - контекст графа (все узлы) для разрешения автоперехода
 * @returns сгенерированный Python-код
 */
export function generateHttpRequestFromNode(node: Node, context?: HttpRequestNodeContext): string {
  return generateHttpRequest(nodeToHttpRequestParams(node, context));
}
