/**
 * @fileoverview Хук для подписки на события проекта через WebSocket
 * @module client/hooks/use-project-events-ws
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Структура события проекта, получаемого по WebSocket
 */
interface ProjectEvent {
  /** Тип события */
  type: 'token-created' | 'token-deleted';
  /** Идентификатор проекта */
  projectId: number;
  /** Дополнительные данные */
  data?: unknown;
  /** Временная метка */
  timestamp: string;
}

/**
 * Подключается к WebSocket терминала с tokenId=0 и слушает события проекта.
 * При получении token-created / token-deleted инвалидирует кэш токенов проекта.
 *
 * @param projectId - Идентификатор проекта для подписки
 */
export function useProjectEventsWs(projectId: number): void {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/terminal?projectId=${projectId}&tokenId=0`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: ProjectEvent = JSON.parse(event.data);
        if (msg.type === 'token-created' || msg.type === 'token-deleted') {
          queryClient.invalidateQueries({
            queryKey: [`/api/projects/${projectId}/tokens`],
          });
        }
      } catch {
        // Игнорируем некорректные сообщения
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [projectId, queryClient]);
}
