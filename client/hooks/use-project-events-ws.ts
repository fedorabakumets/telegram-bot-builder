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
  type: 'token-created' | 'token-deleted' | 'bot-started' | 'bot-stopped' | 'bot-error';
  /** Идентификатор проекта */
  projectId: number;
  /** ID токена (для событий бота) */
  tokenId?: number;
  /** Дополнительные данные */
  data?: unknown;
  /** Временная метка */
  timestamp: string;
}

/**
 * Подключается к WebSocket терминала с tokenId=0 и слушает события проекта.
 * При token-created/token-deleted инвалидирует кэш токенов.
 * При bot-started/bot-stopped/bot-error инвалидирует историю запусков и статус бота.
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

        if (msg.type === 'bot-started' || msg.type === 'bot-stopped' || msg.type === 'bot-error') {
          // Инвалидируем историю запусков для конкретного токена
          if (msg.tokenId) {
            queryClient.invalidateQueries({ queryKey: ['launch-history', msg.tokenId] });
          }
          // Инвалидируем статус бота
          if (msg.tokenId) {
            queryClient.invalidateQueries({ queryKey: [`/api/tokens/${msg.tokenId}/bot-status`] });
          }
          // Инвалидируем общую информацию о боте
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/bot/info`] });
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
