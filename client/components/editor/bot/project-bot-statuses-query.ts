/**
 * @fileoverview Ключ React Query для списка live-статусов ботов проекта
 * @module editor/bot/project-bot-statuses-query
 */

/**
 * Ключ GET /api/projects/:id/bot/statuses
 * @param projectId - ID проекта
 * @returns Ключ запроса
 */
export function projectBotStatusesQueryKey(projectId: number): readonly [string] {
  return [`/api/projects/${projectId}/bot/statuses`];
}

/**
 * Это ключ списка статусов проекта или одиночного bot-status
 * @param queryKey0 - Первый элемент queryKey
 * @returns true, если это кэш статусов ботов
 */
export function isBotStatusQueryKey(queryKey0: unknown): boolean {
  if (typeof queryKey0 !== 'string') return false;
  return queryKey0.endsWith('/bot-status') || queryKey0.endsWith('/bot/statuses');
}
