/** @fileoverview Ограниченная инвалидация данных таблиц по событию доступного проекта. */

/**
 * Выбирает только ключи таблиц соответствующего проекта, включая графики.
 * @param key - Ключ React Query.
 * @param projectId - Открытый проект.
 * @returns Принадлежность ключа обновляемым данным.
 */
export function isTableLiveKey(key: readonly unknown[], projectId: number): boolean {
  return key[1] === projectId && ['bot-tables', 'bot-table-columns', 'bot-table-rows', 'bot-table-chart', 'bot-table-chart-suggestions'].includes(String(key[0]));
}
