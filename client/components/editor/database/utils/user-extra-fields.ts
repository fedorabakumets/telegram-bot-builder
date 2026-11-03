/** @fileoverview Извлечение дополнительных полей пользователя из разных ответов API. */

/**
 * Извлекает теги из верхнего уровня или данных пользователя.
 * @param user - Данные пользователя из API.
 * @returns Список строковых тегов.
 */
export function getUserTags(user: unknown): string[] {
  if (!user || typeof user !== 'object') return [];
  const record = user as Record<string, unknown>;
  const data = record.userData && typeof record.userData === 'object' ? record.userData as Record<string, unknown> : {};
  const tags = Array.isArray(record.tags) ? record.tags : data.tags;
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : [];
}

/**
 * Возвращает реальную дату обновления при её наличии в ответе.
 * @param user - Данные пользователя из API.
 * @returns Дата обновления или null.
 */
export function getUserUpdatedAt(user: unknown): string | Date | null {
  if (!user || typeof user !== 'object') return null;
  const value = (user as Record<string, unknown>).updatedAt;
  return typeof value === 'string' || value instanceof Date ? value : null;
}
