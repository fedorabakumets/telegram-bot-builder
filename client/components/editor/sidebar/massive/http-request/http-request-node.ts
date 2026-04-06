/**
 * @fileoverview Определение узла HTTP запроса для сайдбара редактора
 * Узел для отправки HTTP запросов к внешним API
 * @module components/editor/sidebar/massive/http-request/http-request-node
 */
import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла HTTP запроса для сайдбара
 */
export const httpRequestNode: ComponentDefinition = {
  id: 'http-request',
  name: 'HTTP запрос',
  description: 'Отправка запроса к внешнему API и сохранение ответа',
  icon: 'fas fa-globe',
  color: 'bg-cyan-100 text-cyan-600',
  type: 'http_request',
  defaultData: {
    httpRequestUrl: '',
    httpRequestMethod: 'GET',
    httpRequestHeaders: '',
    httpRequestBody: '',
    httpRequestTimeout: 30,
    httpRequestResponseVariable: 'response',
    httpRequestStatusVariable: '',
    httpRequestQueryParams: '',
    httpRequestBodyFormat: 'json',
    httpRequestAuthType: 'none',
    httpRequestResponseFormat: 'autodetect',
    httpRequestIgnoreHttpErrors: false,
    httpRequestIgnoreSsl: false,
    httpRequestFollowRedirects: true,
    keyboardType: 'none',
    buttons: [],
  },
};
