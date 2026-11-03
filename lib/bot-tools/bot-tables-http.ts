/**
 * @fileoverview Безопасный HTTP к API таблиц: без тела ответов 401/403/500
 * @module lib/bot-tools/bot-tables-http
 */

import { apiFetch } from './api-fetch.ts';
import { readTablePersistenceProof, TABLE_PERSISTENCE_PROOF } from './table-persistence-proof';
/** Безопасная ошибка с кодом и индексами без внутренних деталей SQL. */
export interface TableHttpError {
  /** Понятное сообщение. */ error: string;
  /** HTTP-код при полученном ответе. */ status?: number;
  /** Неопределённый исход записи требует чтения состояния до повторного выполнения. */ outcome?: 'unknown';
  /** Индекс ошибочной операции. */ failed_op_index?: number;
  /** Индекс ошибочной таблицы. */ failed_table_index?: number;
}

/** Опции запроса к API */
export interface TableHttpOptions {
  /** UUID одной попытки записи; повтор возвращает квитанцию ID вместо старых данных. */
  requestId?: string;
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
): Promise<T | TableHttpError> {
  const mayWrite = !['GET', 'HEAD', 'OPTIONS'].includes((init?.method ?? 'GET').toUpperCase());
  let response: Response;
  try {
    response = await apiFetch(path, init);
  } catch (error) {
    return { error: `Не удалось соединиться с сервером: ${(error as Error).message}`,
      ...(mayWrite ? { outcome: 'unknown' as const } : {}) };
  }
  if (!response.ok) {
    const failure = await safeHttpError(response);
    return { ...failure, ...(mayWrite && (response.status >= 500 || response.status === 408) ? { outcome: 'unknown' as const } : {}) };
  }
  try {
    const data = await response.json();
    const proof = readTablePersistenceProof(response, path);
    if (proof && data && typeof data === 'object') Object.defineProperty(data, TABLE_PERSISTENCE_PROOF, { value: proof });
    return data as T;
  } catch (error) {
    return { error: `Не удалось разобрать ответ сервера: ${(error as Error).message}`,
      ...(mayWrite ? { outcome: 'unknown' as const } : {}) };
  }
}

/**
 * Прячет тело опасных ответов и оставляет короткое сообщение 400/404
 * @param response - Ответ fetch
 * @returns Объект ошибки
 */
async function safeHttpError(response: Response): Promise<TableHttpError> {
  if (response.status === 401 || response.status === 403 || response.status >= 500) {
    await response.text().catch(() => '');
    return { error: `HTTP ${response.status}`, status: response.status };
  }
  let message = '';
  const indices: Pick<TableHttpError, 'failed_op_index' | 'failed_table_index'> = {};
  try {
    const body = (await response.json()) as { message?: unknown; failed_op_index?: unknown; failed_table_index?: unknown };
    if (typeof body.message === 'string') message = body.message.slice(0, 300);
    for (const key of ['failed_op_index', 'failed_table_index'] as const) {
      const index = body[key];
      if (typeof index === 'number' && Number.isSafeInteger(index) && index >= 0) indices[key] = index;
    }
  } catch {
    await response.text().catch(() => '');
  }
  return { error: message ? `HTTP ${response.status}: ${message}` : `HTTP ${response.status}`, status: response.status, ...indices };
}

/**
 * Признак объекта ошибки
 * @param value - Ответ
 * @returns true, если есть error
 */
export function isTableError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === 'object' && 'error' in (value as object);
}
