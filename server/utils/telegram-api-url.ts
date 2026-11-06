/**
 * @fileoverview Выбор и проверка адреса Telegram Bot API.
 */
import { runtimeEnv } from '../services/runtime-overlay';

/** Официальный адрес Telegram Bot API. */
export const OFFICIAL_TELEGRAM_API = 'https://api.telegram.org';

/**
 * Проверяет базовый адрес локального API без учётных данных и пути.
 * @param value - Введённый адрес
 * @returns Нормализованный адрес
 */
export function validateTelegramApiUrl(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Укажите полный адрес локального Bot API, например http://127.0.0.1:8081'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || !['', '/'].includes(url.pathname) || url.search || url.hash) {
    throw new Error('Адрес Bot API должен содержать только HTTP или HTTPS, хост и порт, без пароля и пути');
  }
  return url.origin;
}

/**
 * Возвращает адрес выбранного Bot API.
 * @param values - Текущие значения формы для проверки без сохранения
 * @returns Базовый адрес без завершающего слеша
 */
export function getTelegramApiBaseUrl(values?: { apiMode: string; apiUrl: string }): string {
  const mode = values ? values.apiMode || 'official' : runtimeEnv('TELEGRAM_BOT_API_MODE') || 'official';
  if (mode === 'official') return OFFICIAL_TELEGRAM_API;
  if (mode !== 'local') throw new Error('Неизвестный режим Telegram Bot API');
  return validateTelegramApiUrl(values ? values.apiUrl.trim() : runtimeEnv('TELEGRAM_BOT_API_URL') || '');
}
