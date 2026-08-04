/**
 * @fileoverview Общий HTTP-хелпер запросов MCP к API запущенного приложения
 * @description Централизует базовый URL и аутентификацию: Bearer берётся из
 * AsyncLocalStorage (remote HTTP MCP) или process.env.MCP_AGENT_TOKEN (stdio).
 * @module lib/bot-tools/api-fetch
 */

import { getMcpToken } from './mcp-request-context.ts';

/** Опции запроса apiFetch: стандартный RequestInit + переопределение базового URL */
export type ApiFetchInit = RequestInit & {
  /** Базовый URL API (по умолчанию API_BASE_URL или http://localhost:5000) */
  apiBaseUrl?: string;
};

/**
 * Резолвит токен агента: сначала request-scoped ALS, иначе env (stdio).
 * @returns Сырой токен или undefined
 */
export function resolveMcpAgentToken(): string | undefined {
  return getMcpToken() ?? process.env.MCP_AGENT_TOKEN;
}

/**
 * Выполняет HTTP-запрос к API приложения с единым базовым URL и токеном агента.
 * Базовый URL: init.apiBaseUrl → process.env.API_BASE_URL → http://localhost:5000.
 * Authorization: Bearer из ALS или MCP_AGENT_TOKEN.
 * @param path - Путь запроса начиная со слэша (например /api/projects/1)
 * @param init - Опции запроса (метод, заголовки, тело, apiBaseUrl)
 * @returns Промис ответа fetch
 */
export function apiFetch(path: string, init?: ApiFetchInit): Promise<Response> {
  const baseUrl = init?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';
  const token = resolveMcpAgentToken();

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const { apiBaseUrl: _apiBaseUrl, ...rest } = init ?? {};
  return fetch(`${baseUrl}${path}`, { ...rest, headers });
}
