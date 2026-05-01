/**
 * @fileoverview Утилита для выполнения HTTP-запросов к Telegram API через прокси или напрямую.
 * Если TELEGRAM_PROXY_URL задан — использует его. Иначе подключается напрямую,
 * явно игнорируя системный прокси Windows (WinInet/реестр).
 * @module server/utils/telegram-proxy
 */

import { ProxyAgent, Agent, fetch as undiciFetch } from 'undici';

/** Агент для прямого подключения (без системного прокси) */
const directAgent = new Agent();

/** Агент для подключения через прокси (если задан TELEGRAM_PROXY_URL) */
let proxyAgent: ProxyAgent | null = null;

/** Флаг однократной инициализации */
let proxyInitialized = false;

/**
 * Инициализирует прокси-агент из переменной окружения TELEGRAM_PROXY_URL.
 * Вызывается один раз при первом обращении.
 */
function initProxy(): void {
  if (proxyInitialized) return;
  proxyInitialized = true;

  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  if (!proxyUrl || proxyUrl.trim() === '') return;

  try {
    proxyAgent = new ProxyAgent(proxyUrl.trim());
    console.log(`[Proxy] Прокси инициализирован: ${proxyUrl.trim()}`);
  } catch (error) {
    console.error(
      `[Proxy] Ошибка создания ProxyAgent:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Возвращает текущий прокси-агент или null, если прокси не настроен.
 * @returns ProxyAgent или null
 */
export function getProxyAgent(): ProxyAgent | null {
  initProxy();
  return proxyAgent;
}

/** @deprecated Используйте getProxyAgent() */
export const getTelegramProxyAgent = getProxyAgent;

/**
 * Выполняет HTTP-запрос через настроенный прокси или напрямую.
 * Явно использует undici Agent, чтобы обойти системный прокси Windows.
 * @param url - URL для запроса
 * @param options - Опции fetch (метод, заголовки, тело и т.д.)
 * @returns Ответ сервера
 */
export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  initProxy();

  const dispatcher = proxyAgent ?? directAgent;

  try {
    return await undiciFetch(url, { ...options, dispatcher } as any) as unknown as Response;
  } catch (error) {
    const label = proxyAgent ? 'через прокси' : 'напрямую (без прокси)';
    console.error(`[Proxy] fetch ${label} не удался:`, error instanceof Error ? error.message : error);
    throw error;
  }
}
