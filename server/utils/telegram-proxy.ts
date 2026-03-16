/**
 * @fileoverview Утилита для получения прокси-агента для Telegram API
 * @module server/utils/telegram-proxy
 */

import { ProxyAgent } from 'undici';

let proxyAgent: ProxyAgent | null = null;
let proxyInitialized = false;

/**
 * Инициализирует прокси-агент
 */
function initProxy(): void {
  if (proxyInitialized) return;
  proxyInitialized = true;
  
  const proxyUrl = process.env.TELEGRAM_PROXY_URL;

  if (!proxyUrl || proxyUrl.trim() === '') {
    return;
  }

  try {
    const url = new URL(proxyUrl.trim());
    console.log(`[Proxy] Creating undici ProxyAgent: ${url.hostname}:${url.port}`);
    proxyAgent = new ProxyAgent(proxyUrl.trim());
    console.log(`[Proxy] ProxyAgent created successfully`);
  } catch (error) {
    console.error(`[Proxy] Invalid proxy URL: ${proxyUrl}`, error);
  }
}

/**
 * Возвращает прокси-агент для использования с fetch
 */
export function getProxyAgent(): ProxyAgent | null {
  initProxy();
  return proxyAgent;
}

/**
 * Выполняет fetch запрос через прокси используя undici
 * @param url - URL запроса
 * @param options - Опции fetch
 * @returns Response от сервера
 */
export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  initProxy();
  
  if (!proxyAgent) {
    // Если прокси нет, используем нативный fetch
    return fetch(url, options);
  }

  // undici ProxyAgent может быть использован как dispatcher
  const response = await fetch(url, {
    ...options,
    dispatcher: proxyAgent,
  } as any);
  
  return response;
}
