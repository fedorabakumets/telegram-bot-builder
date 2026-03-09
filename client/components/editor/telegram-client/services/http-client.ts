/**
 * @fileoverview Единый HTTP клиент для API запросов
 *
 * Предоставляет абстракцию над fetch с обработкой ошибок и таймаутов.
 *
 * @module HttpClient
 */

import { REQUEST_TIMEOUT } from '../constants';

/**
 * HTTP методы
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Опции HTTP запроса
 */
export interface HttpOptions {
  /** HTTP метод */
  method?: HttpMethod;
  /** Тело запроса */
  body?: unknown;
  /** Таймаут в мс */
  timeout?: number;
  /** Дополнительные заголовки */
  headers?: Record<string, string>;
}

/**
 * HTTP клиент для выполнения API запросов
 *
 * @example
 * ```typescript
 * const http = new HttpClient();
 * const data = await http.get('/api/status');
 * await http.post('/api/save', { key: 'value' });
 * ```
 */
export class HttpClient {
  private defaultTimeout: number;

  constructor(timeout: number = REQUEST_TIMEOUT) {
    this.defaultTimeout = timeout;
  }

  /**
   * Выполняет HTTP запрос
   *
   * @param {string} url - URL запроса
   * @param {HttpOptions} options - Опции запроса
   * @returns {Promise<T>} Данные ответа
   *
   * @example
   * ```typescript
   * const result = await http.request('/api/data', { method: 'POST', body: { foo: 'bar' } });
   * ```
   */
  async request<T>(url: string, options: HttpOptions = {}): Promise<T> {
    const { method = 'GET', body, timeout = this.defaultTimeout, headers = {} } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Пустой ответ для 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET запрос
   *
   * @param {string} url - URL запроса
   * @returns {Promise<T>} Данные ответа
   */
  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST запрос
   *
   * @param {string} url - URL запроса
   * @param {unknown} body - Тело запроса
   * @returns {Promise<T>} Данные ответа
   */
  async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, { method: 'POST', body });
  }

  /**
   * PUT запрос
   *
   * @param {string} url - URL запроса
   * @param {unknown} body - Тело запроса
   * @returns {Promise<T>} Данные ответа
   */
  async put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body });
  }

  /**
   * DELETE запрос
   *
   * @param {string} url - URL запроса
   * @returns {Promise<T>} Данные ответа
   */
  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

/**
 * Создать экземпляр HTTP клиента
 *
 * @param {number} timeout - Таймаут в мс
 * @returns {HttpClient} Экземпляр клиента
 */
export function createHttpClient(timeout?: number): HttpClient {
  return new HttpClient(timeout);
}
