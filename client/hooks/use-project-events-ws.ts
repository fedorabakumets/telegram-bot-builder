/**
 * @fileoverview Хук для подписки на события проекта через WebSocket.
 * Поддерживает опциональный callback при создании нового токена.
 * @module client/hooks/use-project-events-ws
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectEvent } from '@shared/project-sync/project-event';

/**
 * Опции хука подписки на события проекта
 */
interface UseProjectEventsWsOptions {
  /**
   * Callback, вызываемый при создании нового токена (бота).
   * @param projectId - ID проекта
   * @param tokenId - ID нового токена
   * @param tokenName - Имя нового токена
   */
  onTokenCreated?: (projectId: number, tokenId: number, tokenName: string) => void;
}

/**
 * Инвалидирует кэш токенов при create/delete/update
 * @param queryClient - React Query client
 * @param projectId - ID проекта
 */
function invalidateProjectTokens(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: number,
): void {
  queryClient.invalidateQueries({
    queryKey: [`/api/projects/${projectId}/tokens`],
  });
  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
}

/**
 * Подключается к WebSocket терминала с tokenId=0 и слушает события проекта.
 * При token-created/token-deleted/token-updated инвалидирует кэш токенов.
 * При bot-started/bot-stopped/bot-error инвалидирует историю запусков и статус бота.
 *
 * @param projectId - Идентификатор проекта для подписки
 * @param options - Опциональные callback-и для событий
 */
export function useProjectEventsWs(projectId: number, options?: UseProjectEventsWsOptions): void {
  const { onTokenCreated } = options ?? {};
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ref для стабильной ссылки на callback без перезапуска эффекта */
  const onTokenCreatedRef = useRef(onTokenCreated);
  onTokenCreatedRef.current = onTokenCreated;
  /**
   * Флаг первого подключения.
   * При первом onopen данные уже загружены при монтировании — рефетч не нужен.
   * При каждом последующем onopen (реконнект) инвалидируем все статусы.
   */
  const isFirstConnectRef = useRef(true);

  useEffect(() => {
    if (!projectId) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=${projectId}&tokenId=0`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isFirstConnectRef.current) {
          isFirstConnectRef.current = false;
          return;
        }
        queryClient.invalidateQueries({
          predicate: (query) =>
            typeof query.queryKey[0] === 'string' &&
            query.queryKey[0].startsWith('/api/tokens/') &&
            query.queryKey[0].endsWith('/bot-status'),
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg: ProjectEvent = JSON.parse(event.data);

          if (
            msg.type === 'token-created'
            || msg.type === 'token-deleted'
            || msg.type === 'token-updated'
          ) {
            invalidateProjectTokens(queryClient, projectId);

            if (msg.type === 'token-created' && msg.tokenId) {
              const tokenName = (msg.data as { tokenName?: string } | undefined)?.tokenName ?? '';
              onTokenCreatedRef.current?.(msg.projectId, msg.tokenId, tokenName);
            }
          }

          if (msg.type === 'bot-started' || msg.type === 'bot-stopped' || msg.type === 'bot-error') {
            if (msg.tokenId) {
              queryClient.invalidateQueries({ queryKey: ['launch-history', msg.tokenId] });
              queryClient.invalidateQueries({ queryKey: [`/api/tokens/${msg.tokenId}/bot-status`] });
            }
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/bot/info`] });
          }
        } catch {
          // Игнорируем некорректные сообщения
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyed) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      isFirstConnectRef.current = true;
    };
  }, [projectId, queryClient]);
}
