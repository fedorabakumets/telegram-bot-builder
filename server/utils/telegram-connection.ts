/**
 * @fileoverview Выбор и проверка адреса подключения Telegram.
 */
import { runtimeEnv } from '../services/runtime-overlay';

/** Прокси окружения до применения настроек площадки. */
let environmentProxy: string | undefined;
/** Признак сохранения исходного окружения. */
let environmentCaptured = false;

/** Сохраняет прокси окружения до его изменения настройками площадки. */
export function captureTelegramEnvironmentProxy(): void {
  if (environmentCaptured) return;
  environmentProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  environmentCaptured = true;
}

/** Настройка соединения Telegram. */
export interface TelegramConnection {
  /** Выбранный способ соединения. */
  mode: 'direct' | 'proxy' | 'auto';
  /** Адрес прокси, если он используется. */
  proxy?: string;
}

/**
 * Проверяет адрес поддерживаемого прокси.
 * @param value - Адрес прокси
 * @returns Нормализованный адрес
 */
export function validateTelegramProxy(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Укажите полный адрес прокси, например http://127.0.0.1:8080'); }
  if (!['http:', 'https:', 'socks5:', 'socks5h:'].includes(url.protocol) || !url.hostname || !['', '/'].includes(url.pathname) || url.search || url.hash) {
    throw new Error('Поддерживается адрес HTTP, HTTPS или SOCKS5 прокси без пути и параметров');
  }
  return url.toString();
}

/**
 * Выбирает способ соединения с учётом прежних настроек.
 * @param values - Значения формы для проверки без сохранения
 * @returns Эффективное соединение
 */
export function getTelegramConnection(values?: { mode: string; proxy: string }): TelegramConnection {
  captureTelegramEnvironmentProxy();
  const configured = values ? values.proxy.trim() || process.env.TELEGRAM_PROXY_URL?.trim() : runtimeEnv('TELEGRAM_PROXY_URL');
  const raw = (values ? values.mode.trim() || process.env.TELEGRAM_CONNECTION_MODE?.trim() : runtimeEnv('TELEGRAM_CONNECTION_MODE')) || (configured ? 'proxy' : 'direct');
  if (!['direct', 'proxy', 'auto'].includes(raw)) throw new Error('Неизвестный режим подключения Telegram');
  const mode = raw as TelegramConnection['mode'];
  const proxy = mode === 'proxy' ? configured : mode === 'auto'
    ? configured || environmentProxy : undefined;
  if (mode === 'proxy' && !proxy) throw new Error('Укажите адрес прокси Telegram');
  return { mode, proxy: proxy ? validateTelegramProxy(proxy) : undefined };
}
