/** @fileoverview Защита временных ссылок и параметров запросов в журнале API. */

/**
 * Возвращает путь без строки параметров, которая может содержать секреты.
 * @param url - Путь или исходный адрес запроса
 * @returns Путь без параметров и фрагмента
 */
export function apiLogPath(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

/**
 * Определяет, можно ли записывать тело JSON-ответа в журнал.
 * @param path - Путь запроса без параметров
 * @returns Признак допустимости журналирования тела
 */
export function mayLogApiResponse(path: string): boolean {
  return !path.startsWith('/api/auth/agent/') && path !== '/api/runtime/media/invoice-link'
    && !/\/webhook-secret\/reveal\/?$/.test(path);
}
