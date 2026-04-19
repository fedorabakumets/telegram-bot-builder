/**
 * @fileoverview Утилита построения URL для запросов базы пользователей
 */

/**
 * Добавляет tokenId в query string, если он выбран
 * @param path - Базовый путь API
 * @param tokenId - Идентификатор выбранного токена
 * @param query - Дополнительные query-параметры
 * @returns Полный URL для клиентского запроса
 */
export function buildUsersApiUrl(
  path: string,
  tokenId?: number | null,
  query?: Record<string, string>
): string {
  const params = new URLSearchParams();

  if (tokenId) {
    params.set('tokenId', String(tokenId));
  }

  Object.entries(query ?? {}).forEach(([key, value]) => {
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
