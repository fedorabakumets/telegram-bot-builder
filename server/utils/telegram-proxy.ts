/**
 * @fileoverview Утилита для получения прокси-агента для Telegram API
 * @module server/utils/telegram-proxy
 */

import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import nodeFetch, { RequestInit, Response } from 'node-fetch';

let proxyAgent: HttpsProxyAgent | SocksProxyAgent | null = null;
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

    // SOCKS прокси
    if (url.protocol === 'socks:' || url.protocol === 'socks4:' || url.protocol === 'socks5:') {
      console.log(`[Proxy] Using SOCKS proxy: ${url.hostname}:${url.port}`);
      proxyAgent = new SocksProxyAgent(proxyUrl.trim());
      return;
    }

    // HTTP/HTTPS прокси
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      console.log(`[Proxy] Using HTTP proxy: ${url.hostname}:${url.port}`);
      proxyAgent = new HttpsProxyAgent(proxyUrl.trim());
      return;
    }

    console.warn(`[Proxy] Unknown proxy protocol: ${url.protocol}, ignoring proxy`);
  } catch (error) {
    console.error(`[Proxy] Invalid proxy URL: ${proxyUrl}`, error);
  }
}

/**
 * Возвращает прокси-агент для HTTPS запросов к Telegram API
 * @returns Прокси-агент или null, если прокси не настроен
 */
export function getTelegramProxyAgent(): HttpsProxyAgent | SocksProxyAgent | null {
  initProxy();
  return proxyAgent;
}

/**
 * Выполняет fetch запрос через прокси
 * @param url - URL запроса
 * @param options - Опции fetch
 * @returns Response от сервера
 */
export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  initProxy();
  
  const agent = getTelegramProxyAgent();
  
  if (!agent) {
    // Если прокси нет, используем нативный fetch
    return fetch(url, options);
  }

  // Используем node-fetch с прокси
  return nodeFetch(url, {
    ...options,
    agent,
  } as any);
}

/**
 * Возвращает опции для fetch запроса с прокси
 * @returns Опции для fetch или null, если прокси не настроен
 */
export function getTelegramFetchOptions(): { agent?: HttpsProxyAgent | SocksProxyAgent } | null {
  const agent = getTelegramProxyAgent();
  
  if (!agent) {
    return null;
  }

  return { agent };
}
