/**
 * @fileoverview Хук для подписки на события проекта через WebSocket.
 * Поддерживает опциональный callback при создании нового токена.
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
 * Подключается к WebSocket терминала с tokenId=0 и слушает события проекта.
 * При token-created/token-deleted инвалидирует кэш токенов.
 * При bot-started/bot-stopped/bot-error инвалидирует историю запусков и статус бота.
 * При token-created вызывает опциональный callback onTokenCreated.
 * Автоматически переподключается при разрыве соединения.
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

  useEffect(() => {
    if (!projectId) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

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
            // Также инвалидируем список проектов на случай изменения счётчиков
            queryClient.invalidateQueries({ queryKey: ['/api/projects'] });

            // Вызываем callback при создании нового токена
            if (msg.type === 'token-created' && msg.tokenId) {
              const tokenName = (msg.data as any)?.tokenName ?? '';
              onTokenCreatedRef.current?.(msg.projectId, msg.tokenId, tokenName);
            }
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

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyed) {
          // Переподключаемся через 3 секунды
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
    };
  }, [projectId, queryClient]);
}
