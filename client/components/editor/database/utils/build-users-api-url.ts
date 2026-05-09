/**
 * @fileoverview Утилита построения URL для запросов базы пользователей
 * @description Корректно объединяет существующие query-параметры пути с tokenId и доп. параметрами
 */

/**
 * Добавляет tokenId и дополнительные параметры к URL, сохраняя уже существующие query-параметры в path.
 * Важно: path может уже содержать query string (например ?granularity=1h) — она не перезаписывается.
 * @param path - Базовый путь API, может содержать query string
 * @param tokenId - Идентификатор выбранного токена (добавляется как tokenId=...)
 * @param query - Дополнительные query-параметры для добавления
 * @returns Полный URL с объединёнными query-параметрами
 */
export function buildUsersApiUrl(
  path: string,
  tokenId?: number | null,
  query?: Record<string, string>
): string {
  // Разбиваем path на базовый путь и существующие query-параметры
  const separatorIndex = path.indexOf('?');
  const basePath = separatorIndex !== -1 ? path.slice(0, separatorIndex) : path;
  const existingQuery = separatorIndex !== -1 ? path.slice(separatorIndex + 1) : '';

  // Начинаем с уже существующих параметров из path
  const params = new URLSearchParams(existingQuery);

  // Добавляем tokenId, если задан
  if (tokenId) {
    params.set('tokenId', String(tokenId));
  }

  // Добавляем дополнительные параметры (могут перезаписать существующие)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
