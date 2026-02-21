/**
 * @file fetch-polyfill.ts
 * @brief Полифилл для глобальной функции fetch
 * 
 * Этот модуль перехватывает глобальную функцию fetch и автоматически
 * добавляет базовый URL для API запросов при работе в Electron.
 * 
 * @description
 * При импорте этого модуля в начале приложения все последующие вызовы fetch
 * будут автоматически использовать правильный базовый URL для API.
 * 
 * @author Telegram Bot Builder Team
 * @version 1.0
 * @date 2026
 */

/**
 * @brief Сохраняет оригинальную функцию fetch
 * @constant {typeof fetch}
 */
const originalFetch = window.fetch;

/**
 * @brief Получает базовый URL для API в зависимости от среды
 * @returns {string} Базовый URL для API
 */
function getApiBase(): string {
  // Electron: используем URL из electronAPI
  if (window.electronAPI?.isElectron) {
    return window.electronAPI.apiUrl || 'https://web-production-19c3c.up.railway.app';
  }
  
  // Веб: используем текущий origin
  if (window.location.protocol.startsWith('http')) {
    return window.location.origin;
  }
  
  // Fallback для localhost
  return 'http://localhost:3000';
}

/**
 * Переопределяет глобальную функцию fetch для обработки API запросов
 * 
 * @param {string | Request | URL} input - URL или Request объект
 * @param {RequestInit} [init] - Опции запроса
 * @returns {Promise<Response>} - Ответ от сервера
 * 
 * @description
 * - Если URL начинается с '/api/', добавляет базовый URL
 * - Иначе использует оригинальный fetch
 */
window.fetch = async function(
  input: string | Request | URL,
  init?: RequestInit
): Promise<Response> {
  // Если это строка и начинается с /api/, добавляем базовый URL
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const url = `${getApiBase()}${input}`;
    
    try {
      const response = await originalFetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
      
      return response;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  }
  
  // Для всех остальных запросов используем оригинальный fetch
  return originalFetch.call(window, input, init);
} as typeof fetch;

// Помечаем что полифилл загружен
(window as any).__FETCH_POLYFILL_LOADED__ = true;
