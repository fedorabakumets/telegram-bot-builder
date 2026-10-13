/**
 * @fileoverview Безопасные страницы истории запусков и логов через API приложения.
 */
import { apiFetch } from './api-fetch.ts';

/** Параметры ограниченной страницы. */
export interface LaunchPageOptions {
  /** Максимум записей в ответе. */
  limit?: number;
  /** Идентификатор, раньше которого читаются записи. */
  beforeId?: number;
  /** Переопределение адреса API. */
  apiBaseUrl?: string;
}

/**
 * Читает массив через авторизованный API, скрывая тело ошибки и секретные поля.
 * @param path - Путь защищённого обработчика
 * @param options - Размер страницы и курсор
 * @param fallback - Размер страницы по умолчанию
 * @param maximum - Верхняя граница страницы
 * @param fields - Разрешённые поля ответа
 * @returns Ограниченная страница либо безопасная ошибка
 */
async function readPage(path: string, options: LaunchPageOptions, fallback: number, maximum: number, fields: string[]) {
  const limit = options.limit ?? fallback;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maximum ||
      (options.beforeId !== undefined && (!Number.isSafeInteger(options.beforeId) || options.beforeId < 1))) {
    return { error: 'Некорректный размер страницы или курсор' };
  }
  const query = new URLSearchParams({ limit: String(limit) });
  if (options.beforeId !== undefined) query.set('beforeId', String(options.beforeId));
  try {
    const response = await apiFetch(`${path}?${query}`, { apiBaseUrl: options.apiBaseUrl });
    if (!response.ok) return { error: `Не удалось прочитать записи: HTTP ${response.status}` };
    const raw: unknown = await response.json();
    if (!Array.isArray(raw) || raw.some(row => !row || typeof row !== 'object' || !Number.isSafeInteger(row.id))) {
      return { error: 'Некорректный ответ API' };
    }
    const rows = raw.slice(0, limit).map(row => Object.fromEntries(fields.map(field => [field, row[field] ?? null])));
    return { total: rows.length, rows, has_more: rows.length === limit,
      next_before_id: rows.length === limit ? Math.min(...rows.map(row => Number(row.id))) : null };
  } catch {
    return { error: 'Не удалось получить записи из API приложения' };
  }
}

/**
 * Возвращает страницу запусков токена; сервер проверяет доступ к его проекту.
 * @param tokenId - Идентификатор токена
 * @param options - Ограничения страницы
 * @returns История запусков и курсор
 */
export async function listBotLaunchesInDb(tokenId: number, options: LaunchPageOptions = {}) {
  if (!Number.isSafeInteger(tokenId) || tokenId < 1) return { error: 'Некорректный token_id' };
  const result = await readPage(`/api/tokens/${tokenId}/launch-history`, options, 10, 100,
    ['id', 'status', 'startedAt', 'stoppedAt', 'errorMessage', 'processId']);
  if ('error' in result) return result;
  const { rows, ...page } = result;
  return { ...page, launches: rows };
}

/**
 * Возвращает страницу логов запуска с проверкой доступа на сервере.
 * @param launchId - Идентификатор запуска
 * @param options - Ограничения страницы
 * @returns Строки логов в порядке возрастания идентификатора и курсор
 */
export async function getLaunchLogsInDb(launchId: number, options: LaunchPageOptions = {}) {
  if (!Number.isSafeInteger(launchId) || launchId < 1) return { error: 'Некорректный launch_id' };
  const result = await readPage(`/api/launch/${launchId}/logs`, options, 100, 500,
    ['id', 'launchId', 'content', 'type', 'timestamp']);
  if ('error' in result) return result;
  const { rows, ...page } = result;
  return { ...page, logs: rows };
}
