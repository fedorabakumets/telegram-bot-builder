/**
 * @fileoverview Валидация URL для защиты от SSRF-атак
 *
 * Проверяет, что URL указывает на внешний ресурс и не позволяет
 * обращаться к внутренним сервисам (localhost, приватные сети, metadata-сервисы).
 *
 * @module server/utils/validateExternalUrl
 */

import { URL } from "node:url";

/**
 * Паттерны приватных/внутренних хостов, запрещённых для запросов.
 * Включают loopback, приватные сети RFC 1918, link-local и служебные домены.
 */
const BLOCKED_HOST_PATTERNS = [
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^\[::1\]$/,
];

/**
 * Суффиксы доменов, запрещённых для запросов (служебные и внутренние зоны).
 */
const BLOCKED_SUFFIXES = [".internal", ".local", ".localhost"];

/**
 * Точные хосты, запрещённые для запросов.
 */
const BLOCKED_EXACT_HOSTS = ["localhost"];

/**
 * Проверяет, что URL безопасен для внешнего HTTP-запроса (защита от SSRF).
 *
 * @param url - URL-адрес для проверки
 * @param requestHost - Значение req.headers.host (для блокировки обращений к себе)
 * @returns Объект с результатом валидации: valid=true или valid=false + reason
 */
export function validateExternalUrl(
  url: string,
  requestHost?: string
): { valid: true } | { valid: false; reason: string } {
  const ERROR_MSG = "Внутренние адреса недоступны для проверки";

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "Невалидный URL" };
  }

  // Только http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Поддерживаются только HTTP и HTTPS" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Точные совпадения
  if (BLOCKED_EXACT_HOSTS.includes(hostname)) {
    return { valid: false, reason: ERROR_MSG };
  }

  // Суффиксы служебных доменов
  if (BLOCKED_SUFFIXES.some((s) => hostname.endsWith(s))) {
    return { valid: false, reason: ERROR_MSG };
  }

  // Паттерны приватных IP-адресов
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname))) {
    return { valid: false, reason: ERROR_MSG };
  }

  // Блокировка обращений к собственному серверу
  if (requestHost && hostname === requestHost.split(":")[0].toLowerCase()) {
    return { valid: false, reason: ERROR_MSG };
  }

  // Проверка API_BASE_URL из env
  const apiBase = process.env.API_BASE_URL;
  if (apiBase) {
    try {
      const apiHost = new URL(apiBase).hostname.toLowerCase();
      if (hostname === apiHost) {
        return { valid: false, reason: ERROR_MSG };
      }
    } catch { /* невалидный API_BASE_URL — игнорируем */ }
  }

  return { valid: true };
}
