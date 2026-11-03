/** @fileoverview Обновление открытой вкладки таблиц после внешней записи MCP и переподключения. */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeSharedTerminalWs, onSharedTerminalWsReconnect } from '@/lib/shared-terminal-ws';
import { isTableLiveKey } from './table-live-keys';

/**
 * Связывает событие и восстановление соединения с повторным чтением своего проекта.
 * @param projectId - Открытый проект.
 * @param invalidate - Повторное чтение данных.
 * @param subscribe - Подписка на события канала.
 * @param onReconnect - Подписка на восстановление канала.
 * @returns Снятие обеих подписок.
 */
export function subscribeTableChanges(projectId: number, invalidate: () => void,
  subscribe = subscribeSharedTerminalWs, onReconnect = onSharedTerminalWsReconnect): () => void {
  const unsubscribe = subscribe(raw => {
    if (!raw || typeof raw !== 'object') return;
    const event = raw as { type?: string; projectId?: number };
    if (event.type === 'table-updated' && event.projectId === projectId) invalidate();
  });
  const reconnect = onReconnect(invalidate);
  return () => { unsubscribe(); reconnect(); };
}

/**
 * Подписывает открытый проект на уже авторизованный канал событий приложения.
 * @param projectId - Открытый проект.
 */
export function useTablesLive(projectId: number): void {
  const client = useQueryClient();
  useEffect(() => {
    if (!projectId) return;
    const invalidate = () => { void client.invalidateQueries({ predicate: query => isTableLiveKey(query.queryKey, projectId) }); };
    return subscribeTableChanges(projectId, invalidate);
  }, [client, projectId]);
}
