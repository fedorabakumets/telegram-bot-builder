/**
 * @fileoverview Общий HTTP-хелпер запросов MCP к API запущенного приложения
 * @description Централизует базовый URL и аутентификацию: читает API_BASE_URL и
 * персональный токен агента MCP_AGENT_TOKEN из process.env и добавляет заголовок
 * Authorization: Bearer (RFC 6750), если токен задан. Используется всеми db-инструментами
 * live-редактирования вместо прямых вызовов fetch.
 * @module lib/bot-tools/api-fetch
 */

/** Опции запроса apiFetch: стандартный RequestInit + переопределение базового URL */
export type ApiFetchInit = RequestInit & {
  /** Базовый URL API (по умолчанию API_BASE_URL или http://localhost:5000) */
  apiBaseUrl?: string;
};

/**
 * Выполняет HTTP-запрос к API приложения с единым базовым URL и токеном агента.
 * Базовый URL берётся из init.apiBaseUrl → process.env.API_BASE_URL → http://localhost:5000.
 * Если задан process.env.MCP_AGENT_TOKEN — добавляется заголовок Authorization: Bearer <token>.
 * @param path - Путь запроса начиная со слэша (например /api/projects/1)
 * @param init - Опции запроса (метод, заголовки, тело, apiBaseUrl)
 * @returns Промис ответа fetch
 */
export function apiFetch(path: string, init?: ApiFetchInit): Promise<Response> {
  const baseUrl = init?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';
  const token = process.env.MCP_AGENT_TOKEN;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const { apiBaseUrl: _apiBaseUrl, ...rest } = init ?? {};
  return fetch(`${baseUrl}${path}`, { ...rest, headers });
}
