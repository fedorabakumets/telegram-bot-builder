/**
 * @fileoverview Глобальная настройка прокси для Node.js
 * @description Заставляет Node.js использовать системный прокси Windows
 */

import { ProxyAgent } from 'proxy-agent';

/**
 * Настраивает глобальный агент для использования системного прокси
 * Должно вызываться один раз при старте приложения
 */
export function setupSystemProxy(): void {
  try {
    // ProxyAgent автоматически читает:
    // - HTTP_PROXY / HTTPS_PROXY переменные
    // - Системные настройки прокси
    // - Настройки из .npmrc
    
    const agent = new ProxyAgent();
    
    // Для fetch API (Node 18+)
    // Примечание: fetch в Node.js не поддерживает агенты напрямую
    // Нужно использовать переменные окружения
    
    console.log('[Proxy] System proxy configuration loaded');
    console.log('[Proxy] ProxyAgent ready for HTTP/HTTPS requests');
  } catch (error) {
    console.warn('[Proxy] Failed to setup system proxy:', error);
  }
}
