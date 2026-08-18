/**
 * @fileoverview Инвалидация кэша статусов ботов (список проекта и одиночный токен)
 * @module editor/bot/invalidate-bot-status-queries
 */

import type { QueryClient } from '@tanstack/react-query';
import { isBotStatusQueryKey, projectBotStatusesQueryKey } from './project-bot-statuses-query';

/**
 * Инвалидирует статусы проекта; при tokenId — ещё и одиночный ключ (совместимость).
 * @param queryClient - React Query
 * @param projectId - ID проекта
 * @param tokenId - Опциональный ID токена
 * @returns void
 */
export function invalidateBotStatusQueries(
  queryClient: QueryClient,
  projectId: number,
  tokenId?: number,
): void {
  queryClient.invalidateQueries({ queryKey: projectBotStatusesQueryKey(projectId) });
  if (tokenId != null) {
    queryClient.invalidateQueries({ queryKey: [`/api/tokens/${tokenId}/bot-status`] });
  }
}

/**
 * Инвалидирует все ключи статусов ботов (reconnect WS).
 * @param queryClient - React Query
 * @returns void
 */
export function invalidateAllBotStatusQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) => isBotStatusQueryKey(query.queryKey[0]),
  });
}
