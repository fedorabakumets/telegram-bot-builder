/**
 * @fileoverview Утилита для получения прокси-агента для Telegram API
 * @module server/utils/telegram-proxy
 */

import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/**
 * Возвращает прокси-агент для HTTPS запросов к Telegram API
 * @returns Прокси-агент или null, если прокси не настроен
 */
export function getTelegramProxyAgent(): HttpsProxyAgent | SocksProxyAgent | null {
  const proxyUrl = process.env.TELEGRAM_PROXY_URL;

  if (!proxyUrl || proxyUrl.trim() === '') {
    return null;
  }

  try {
    const url = new URL(proxyUrl.trim());

    // SOCKS прокси
    if (url.protocol === 'socks:' || url.protocol === 'socks4:' || url.protocol === 'socks5:') {
      console.log(`[Proxy] Using SOCKS proxy: ${url.hostname}:${url.port}`);
      return new SocksProxyAgent(proxyUrl.trim());
    }

    // HTTP/HTTPS прокси
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      console.log(`[Proxy] Using HTTP proxy: ${url.hostname}:${url.port}`);
      return new HttpsProxyAgent(proxyUrl.trim());
    }

    console.warn(`[Proxy] Unknown proxy protocol: ${url.protocol}, ignoring proxy`);
    return null;
  } catch (error) {
    console.error(`[Proxy] Invalid proxy URL: ${proxyUrl}`, error);
    return null;
  }
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
