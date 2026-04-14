/**
 * @fileoverview Хук для подписки на события ВСЕХ проектов через одно WebSocket-соединение.
 * Использует специальный режим сервера: projectId=0 + tokenId=0.
 * @module client/hooks/use-all-projects-events-ws
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
 * Опции хука подписки на события всех проектов
 */
export interface UseAllProjectsEventsWsOptions {
  /**
   * Callback при создании нового токена в любом из проектов.
   * @param projectId - ID проекта
   * @param tokenId - ID нового токена
   * @param tokenName - Имя нового токена
   */
  onTokenCreated?: (projectId: number, tokenId: number, tokenName: string) => void;
  /**
   * Callback при запуске бота — используется для очистки логов на всех вкладках.
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   */
  onBotStarted?: (projectId: number, tokenId: number) => void;
}

/**
 * Инвалидирует кэш токенов и проектов при событии создания/удаления токена
 * @param queryClient - Клиент React Query
 * @param msg - Событие проекта
 * @param onTokenCreated - Опциональный callback
 */
function handleTokenEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  msg: ProjectEvent,
  onTokenCreated?: UseAllProjectsEventsWsOptions['onTokenCreated'],
): void {
  queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/tokens`] });
  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  if (msg.type === 'token-created' && msg.tokenId) {
    const tokenName = (msg.data as any)?.tokenName ?? '';
    onTokenCreated?.(msg.projectId, msg.tokenId, tokenName);
  }
}

/**
 * Инвалидирует кэш статуса бота и истории запусков
 * @param queryClient - Клиент React Query
 * @param msg - Событие проекта
 */
function handleBotEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  msg: ProjectEvent,
): void {
  if (msg.tokenId) {
    queryClient.invalidateQueries({ queryKey: ['launch-history', msg.tokenId] });
    queryClient.invalidateQueries({ queryKey: [`/api/tokens/${msg.tokenId}/bot-status`] });
  }
  queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/bot/info`] });
}

/**
 * Открывает одно WebSocket-соединение для получения событий всех проектов пользователя.
 * Сервер идентифицирует пользователя по сессии при projectId=0.
 * Автоматически переподключается при разрыве соединения.
 *
 * @param options - Опциональные callback-и для событий
 */
export function useAllProjectsEventsWs(options?: UseAllProjectsEventsWsOptions): void {
  const { onTokenCreated, onBotStarted } = options ?? {};
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTokenCreatedRef = useRef(onTokenCreated);
  onTokenCreatedRef.current = onTokenCreated;
  const onBotStartedRef = useRef(onBotStarted);
  onBotStartedRef.current = onBotStarted;
  /** Флаг первого подключения — при первом onopen рефетч не нужен */
  const isFirstConnectRef = useRef(true);

  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isFirstConnectRef.current) {
          isFirstConnectRef.current = false;
          return;
        }
        // Реконнект — инвалидируем все bot-status чтобы подтянуть пропущенные изменения
        queryClient.invalidateQueries({
          predicate: (query) =>
            typeof query.queryKey[0] === 'string' &&
            (query.queryKey[0] as string).endsWith('/bot-status'),
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg: ProjectEvent = JSON.parse(event.data);
          if (msg.type === 'token-created' || msg.type === 'token-deleted') {
            handleTokenEvent(queryClient, msg, onTokenCreatedRef.current);
          }
          if (msg.type === 'bot-started' || msg.type === 'bot-stopped' || msg.type === 'bot-error') {
            handleBotEvent(queryClient, msg);
          }
          if (msg.type === 'bot-started' && msg.tokenId) {
            onBotStartedRef.current?.(msg.projectId, msg.tokenId);
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

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      isFirstConnectRef.current = true;
    };
  }, [queryClient]);
}
