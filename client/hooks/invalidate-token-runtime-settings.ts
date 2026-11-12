/**
 * @fileoverview Синхронизация настроек исполнения ботов после событий и восстановления WebSocket.
 */
import type { QueryClient } from '@tanstack/react-query';

/**
 * Обновляет настройки и окружение только изменённого бота без переноса секретов через WebSocket.
 * @param queryClient - Клиент кэша запросов
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор изменённого бота
 */
export function invalidateTokenRuntimeSettings(queryClient: QueryClient, projectId: number, tokenId?: number): void {
  if (!tokenId) return;
  const base = `/api/projects/${projectId}/tokens/${tokenId}`;
  void queryClient.invalidateQueries({ queryKey: [`${base}/runtime-settings`] });
  void queryClient.invalidateQueries({ queryKey: [`${base}/env-variables`] });
}

/**
 * Восстанавливает пропущенные изменения настроек после разрыва соединения.
 * @param queryClient - Клиент кэша запросов
 * @param projectId - Ограничение одним проектом для отдельной подписки
 */
export function invalidateRuntimeSettingsAfterReconnect(queryClient: QueryClient, projectId?: number): void {
  const project = projectId == null ? '\\d+' : String(projectId);
  const pattern = new RegExp(`^/api/projects/${project}/tokens(?:/\\d+/(?:runtime-settings|env-variables))?$`);
  void queryClient.invalidateQueries({
    predicate: (query) => typeof query.queryKey[0] === 'string' && pattern.test(query.queryKey[0]),
  });
}
