/**
 * @file api-client.ts
 * @brief Универсальный клиент для API запросов
 * 
 * Этот модуль предоставляет единый интерфейс для выполнения HTTP-запросов
 * к серверному API. Автоматически определяет среду выполнения (Electron или браузер)
 * и выбирает соответствующий базовый URL для API.
 * 
 * @author Telegram Bot Builder Team
 * @version 1.0
 * @date 2026
 */

/**
 * Определяет базовый URL для API в зависимости от среды выполнения
 * 
 * @returns {string} Базовый URL для API запросов
 * 
 * @description
 * - В Electron (file://) возвращает URL на Railway сервер
 * - В браузере возвращает текущий origin
 * - При разработке возвращает localhost:3000
 */
function getApiBase(): string {
  // Electron среда (file:// протокол)
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'https://web-production-19c3c.up.railway.app';
  }
  
  // Веб-браузер (http:// или https://)
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  
  // По умолчанию (серверная сторона или fallback)
  return 'http://localhost:3000';
}

/**
 * Базовый URL для всех API запросов
 * @constant {string}
 */
const API_BASE = getApiBase();

/**
 * Выполняет HTTP-запрос к API серверу
 * 
 * @template T - Тип ожидаемого ответа
 * @param {string} endpoint - Путь к API endpoint (начинается с /)
 * @param {RequestInit} [options] - Опции fetch запроса
 * @returns {Promise<T>} - Данные ответа
 * 
 * @throws {Error} При ошибке HTTP запроса
 * 
 * @example
 * const projects = await apiRequest('/api/projects/list');
 * const templates = await apiRequest('/api/templates', { method: 'POST', body: JSON.stringify(data) });
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Выполняет GET запрос к API
 * 
 * @template T - Тип ожидаемого ответа
 * @param {string} endpoint - Путь к API endpoint
 * @returns {Promise<T>} - Данные ответа
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * Выполняет POST запрос к API
 * 
 * @template T - Тип ожидаемого ответа
 * @template B - Тип отправляемых данных
 * @param {string} endpoint - Путь к API endpoint
 * @param {B} data - Данные для отправки
 * @returns {Promise<T>} - Данные ответа
 */
export async function apiPost<T, B = any>(endpoint: string, data: B): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
