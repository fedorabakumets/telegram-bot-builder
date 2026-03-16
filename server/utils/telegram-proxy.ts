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
  console.log(`[🔧 Proxy] Вызов initProxy()`);
  console.log(`[🔧 Proxy] proxyInitialized = ${proxyInitialized}`);
  
  if (proxyInitialized) {
    console.log(`[🔧 Proxy] Прокси уже инициализирован, выходим`);
    return;
  }
  
  proxyInitialized = true;
  
  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  console.log(`[🔧 Proxy] TELEGRAM_PROXY_URL из .env: "${proxyUrl}"`);

  if (!proxyUrl || proxyUrl.trim() === '') {
    console.log(`[🔧 Proxy] Прокси не настроен (пустая строка), выходим`);
    return;
  }

  try {
    const url = new URL(proxyUrl.trim());
    console.log(`[🔧 Proxy] Распарсен URL:`);
    console.log(`  - protocol: ${url.protocol}`);
    console.log(`  - hostname: ${url.hostname}`);
    console.log(`  - port: ${url.port}`);
    console.log(`  - username: ${url.username || '(нет)'}`);
    console.log(`  - password: ${url.password ? '***' : '(нет)'}`);
    
    console.log(`[🔧 Proxy] Создаём undici ProxyAgent...`);
    proxyAgent = new ProxyAgent(proxyUrl.trim());
    console.log(`[✅ Proxy] ProxyAgent успешно создан!`);
    console.log(`[✅ Proxy] Тип代理агента: ${proxyAgent.constructor.name}`);
  } catch (error) {
    console.error(`[❌ Proxy] Ошибка создания ProxyAgent:`, error);
    console.error(`[❌ Proxy] Тип ошибки:`, error instanceof Error ? error.constructor.name : 'Unknown');
    console.error(`[❌ Proxy] Сообщение:`, error instanceof Error ? error.message : error);
    console.error(`[❌ Proxy] Стек:`, error instanceof Error ? error.stack : 'No stack');
  }
}

/**
 * Возвращает прокси-агент для использования с fetch
 */
export function getProxyAgent(): ProxyAgent | null {
  console.log(`[📞 Proxy] Вызов getProxyAgent()`);
  initProxy();
  console.log(`[📞 Proxy] Возвращаем proxyAgent: ${proxyAgent ? 'создан' : 'null'}`);
  return proxyAgent;
}

/**
 * @deprecated Используйте getProxyAgent() вместо getTelegramProxyAgent()
 */
export const getTelegramProxyAgent = getProxyAgent;

/**
 * Выполняет fetch запрос через прокси используя undici
 * @param url - URL запроса
 * @param options - Опции fetch
 * @returns Response от сервера
 */
export async function fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
  const startTime = Date.now();
  console.log(`[🌐 Proxy] >>> ЗАПРОС fetchWithProxy`);
  console.log(`[🌐 Proxy] URL: ${url}`);
  console.log(`[🌐 Proxy] Метод: ${options?.method || 'GET'}`);
  console.log(`[🌐 Proxy] Headers:`, JSON.stringify(options?.headers, null, 2));
  console.log(`[🌐 Proxy] Body:`, options?.body ? 'есть' : 'нет');
  console.log(`[🌐 Proxy] Signal:`, options?.signal ? 'есть (timeout)' : 'нет');
  
  initProxy();
  
  console.log(`[🌐 Proxy] proxyAgent после initProxy: ${proxyAgent ? 'создан' : 'null'}`);
  
  if (!proxyAgent) {
    console.log(`[⚠️ Proxy] Прокси НЕ настроен, используем обычный fetch`);
    console.log(`[⚠️ Proxy] Выполняем fetch(${url}) без прокси...`);
    try {
      const response = await fetch(url, options);
      console.log(`[✅ Proxy] Обычный fetch завершён за ${Date.now() - startTime}ms, статус: ${response.status}`);
      return response;
    } catch (error) {
      console.error(`[❌ Proxy] Обычный fetch НЕ удался:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  console.log(`[🔵 Proxy] Используем undici ProxyAgent`);
  console.log(`[🔵 Proxy] Тип dispatcher: ${proxyAgent.constructor.name}`);
  console.log(`[🔵 Proxy] Выполняем fetch с dispatcher...`);
  
  try {
    const response = await fetch(url, {
      ...options,
      dispatcher: proxyAgent,
    } as any);
    
    const duration = Date.now() - startTime;
    console.log(`[✅ Proxy] Запрос через прокси завершён за ${duration}ms`);
    console.log(`[✅ Proxy] Статус ответа: ${response.status} ${response.statusText}`);
    console.log(`[✅ Proxy] Заголовки ответа:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[❌ Proxy] Запрос через прокси НЕ удался за ${duration}ms`);
    console.error(`[❌ Proxy] Тип ошибки:`, error instanceof Error ? error.constructor.name : 'Unknown');
    console.error(`[❌ Proxy] Сообщение:`, error instanceof Error ? error.message : error);
    console.error(`[❌ Proxy] Причина (cause):`, error instanceof Error && 'cause' in error ? (error.cause as any)?.message || error.cause : 'No cause');
    console.error(`[❌ Proxy] Стек:`, error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}
