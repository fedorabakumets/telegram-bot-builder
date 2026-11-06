/**
 * @fileoverview HTTP-запросы Telegram с выбранным соединением.
 */
import { ProxyAgent, Agent, fetch as undiciFetch } from 'undici';
import { getTelegramConnection } from './telegram-connection';
import { createTelegramSocksAgent } from './telegram-socks-agent';

/** Агент прямого соединения. */
const directAgent = new Agent();
/** Кэш агента прокси. */
let proxyAgent: ProxyAgent | Agent | null = null;
/** Адрес, для которого создан агент. */
let cachedProxy: string | undefined;

/** Сбрасывает кэш соединения после изменения настроек. */
export function resetTelegramProxy(): void { proxyAgent = null; cachedProxy = undefined; }

/**
 * Возвращает агент выбранного прокси.
 * @returns Агент или null для прямого соединения
 */
export function getProxyAgent(): ProxyAgent | Agent | null {
  const { proxy } = getTelegramConnection();
  if (!proxy) return null;
  if (!proxyAgent || proxy !== cachedProxy) {
    proxyAgent = /^socks5h?:/i.test(proxy) ? createTelegramSocksAgent(proxy) : new ProxyAgent(proxy);
    cachedProxy = proxy;
  }
  return proxyAgent;
}

/** Устаревшее имя функции получения агента. */
export const getTelegramProxyAgent = getProxyAgent;

/**
 * Выполняет запрос через выбранное соединение.
 * @param url - Адрес запроса
 * @param options - Параметры запроса
 * @returns Ответ сервера
 */
export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  return await undiciFetch(url, { ...options, dispatcher: getProxyAgent() ?? directAgent } as any) as unknown as Response;
}
