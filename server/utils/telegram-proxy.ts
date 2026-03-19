/**
 * @fileoverview Утилита для получения прокси-агента для Telegram API
 * @module server/utils/telegram-proxy
 */

import { ProxyAgent } from 'undici';

let proxyAgent: ProxyAgent | null = null;
let proxyInitialized = false;

function initProxy(): void {
  if (proxyInitialized) return;
  proxyInitialized = true;

  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  if (!proxyUrl || proxyUrl.trim() === '') return;

  try {
    proxyAgent = new ProxyAgent(proxyUrl.trim());
  } catch (error) {
    console.error(`[Proxy] Ошибка создания ProxyAgent:`, error instanceof Error ? error.message : error);
  }
}

export function getProxyAgent(): ProxyAgent | null {
  initProxy();
  return proxyAgent;
}

/** @deprecated Используйте getProxyAgent() */
export const getTelegramProxyAgent = getProxyAgent;

export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  initProxy();

  if (!proxyAgent) {
    try {
      return await fetch(url, options);
    } catch (error) {
      console.error(`[Proxy] fetch без прокси не удался:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  try {
    return await fetch(url, { ...options, dispatcher: proxyAgent } as any);
  } catch (error) {
    console.error(`[Proxy] fetch через прокси не удался:`, error instanceof Error ? error.message : error);
    throw error;
  }
}
