/**
 * @fileoverview Ограниченная пагинация API истории запусков и их логов.
 */

/**
 * Проверяет размер страницы и курсор идентификатора.
 * @param query - Параметры HTTP-запроса
 * @param fallback - Размер страницы по умолчанию
 * @param maximum - Максимальный размер страницы
 * @returns Проверенные параметры либо сообщение ошибки
 */
export function parseLaunchPage(query: Record<string, unknown>, fallback: number, maximum: number) {
  const limit = query.limit === undefined ? fallback : Number(query.limit);
  const beforeId = query.beforeId === undefined ? undefined : Number(query.beforeId);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maximum ||
      (beforeId !== undefined && (!Number.isSafeInteger(beforeId) || beforeId < 1))) {
    return { error: 'Некорректный размер страницы или курсор' };
  }
  return { limit, beforeId };
}
