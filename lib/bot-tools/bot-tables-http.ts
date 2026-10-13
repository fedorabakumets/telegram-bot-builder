/**
 * @fileoverview Безопасный HTTP к API таблиц: без тела ответов 401/403/500
 * @module lib/bot-tools/bot-tables-http
 */

import { apiFetch } from './api-fetch.ts';

/** Опции запроса к API */
export interface TableHttpOptions {
  /** Базовый URL, если не локальный сервер по умолчанию */
  apiBaseUrl?: string;
}

/**
 * Выполняет запрос и возвращает JSON или безопасную ошибку
 * @param path - Путь API
 * @param init - Метод, тело и базовый URL
 * @returns Данные или { error }
 */
export async function tableRequest<T>(
  path: string,
  init?: RequestInit & TableHttpOptions,
): Promise<T | { error: string }> {
  let response: Response;
  try {
    response = await apiFetch(path, init);
  } catch (error) {
    return { error: `Не удалось соединиться с сервером: ${(error as Error).message}` };
  }
  if (!response.ok) return safeHttpError(response);
  try {
    return (await response.json()) as T;
  } catch (error) {
    return { error: `Не удалось разобрать ответ сервера: ${(error as Error).message}` };
  }
}

/**
 * Прячет тело опасных ответов и оставляет короткое сообщение 400/404
 * @param response - Ответ fetch
 * @returns Объект ошибки
 */
async function safeHttpError(response: Response): Promise<{ error: string }> {
  if (response.status === 401 || response.status === 403 || response.status >= 500) {
    await response.text().catch(() => '');
    return { error: `HTTP ${response.status}` };
  }
  let message = '';
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === 'string') message = body.message.slice(0, 300);
  } catch {
    await response.text().catch(() => '');
  }
  return { error: message ? `HTTP ${response.status}: ${message}` : `HTTP ${response.status}` };
}

/**
 * Признак объекта ошибки
 * @param value - Ответ
 * @returns true, если есть error
 */
export function isTableError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === 'object' && 'error' in (value as object);
}
