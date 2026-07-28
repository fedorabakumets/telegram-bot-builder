/**
 * @fileoverview Хук для подписки на события ВСЕХ проектов через одно WebSocket-соединение.
 * Использует специальный режим сервера: projectId=0 + tokenId=0.
 * @module client/hooks/use-all-projects-events-ws
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBotLogs } from '@/components/editor/bot/contexts/bot-logs-context';
import { useActiveTerminals } from '@/components/editor/bot/contexts/ActiveTerminalsContext';
import { resolveBotDisplayNameFromCache } from '@/components/editor/bot/contexts/bot-control-utils';
import { subscribeSharedTerminalWs, onSharedTerminalWsReconnect } from '@/lib/shared-terminal-ws';
import type { ProjectEvent, StartOfflineProgressPayload } from '@shared/project-sync/project-event';
import { startOfflineProgressQueryKey } from '@/components/editor/bot/start-offline-progress-query';

/**
 * Структура события проекта, получаемого по WebSocket
 * (реэкспорт shared; локальный alias для логов stdout/stderr)
 */
type AllProjectsWsEvent = ProjectEvent;

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
  msg: AllProjectsWsEvent,
  onTokenCreated?: UseAllProjectsEventsWsOptions['onTokenCreated'],
): void {
  queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/tokens`] });
  queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  if (msg.type === 'token-created' && msg.tokenId) {
    const tokenName = (msg.data as { tokenName?: string } | undefined)?.tokenName ?? '';
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
  msg: AllProjectsWsEvent,
): void {
  if (msg.tokenId) {
    queryClient.invalidateQueries({ queryKey: ['launch-history', msg.tokenId] });
    queryClient.invalidateQueries({ queryKey: [`/api/tokens/${msg.tokenId}/bot-status`] });
    // Подтянуть логи из БД без F5 (если live-WS пропустил строки)
    queryClient.invalidateQueries({
      queryKey: ['/api/projects', msg.projectId, 'tokens', msg.tokenId, 'logs'],
    });
  }
  queryClient.invalidateQueries({ queryKey: [`/api/projects/${msg.projectId}/bot/info`] });
}

/**
 * Сохраняет прогресс bulk start-offline в React Query (без тостов)
 * @param queryClient - React Query client
 * @param msg - Событие проекта
 */
function handleStartOfflineProgress(
  queryClient: ReturnType<typeof useQueryClient>,
  msg: AllProjectsWsEvent,
): void {
  const data = msg.data as StartOfflineProgressPayload | undefined;
  if (!data || typeof data.total !== 'number') return;
  queryClient.setQueryData(startOfflineProgressQueryKey(msg.projectId), data);
  if (msg.tokenId) {
    queryClient.invalidateQueries({ queryKey: [`/api/tokens/${msg.tokenId}/bot-status`] });
  }
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
  const { addLog } = useBotLogs();
  const { terminals, addTerminal } = useActiveTerminals();
  const onTokenCreatedRef = useRef(onTokenCreated);
  onTokenCreatedRef.current = onTokenCreated;
  const onBotStartedRef = useRef(onBotStarted);
  onBotStartedRef.current = onBotStarted;
  /** Счётчик логов для диагностики */
  const logCountRef = useRef(0);
  /** Актуальный список терминалов для проверки наличия вкладки */
  const terminalsRef = useRef(terminals);
  terminalsRef.current = terminals;
  /** Множество ключей для которых уже создана вкладка (избегаем повторных вызовов addTerminal) */
  const createdTabsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeReconnect = onSharedTerminalWsReconnect(() => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          (query.queryKey[0] as string).endsWith('/bot-status'),
      });
    });

    const unsubscribe = subscribeSharedTerminalWs((raw) => {
      try {
        const msg = raw as AllProjectsWsEvent;

        // Логи бота (stdout/stderr) — всегда записываем в BotLogsContext.
        // Дедупликация в addLog (500ms окно) предотвращает дубли с live-терминалом.
        if ((msg.type === 'stdout' || msg.type === 'stderr') && msg.projectId && msg.tokenId && msg.content) {
          const logKey = `${msg.projectId}-${msg.tokenId}`;
          const ts = msg.timestamp ? new Date(msg.timestamp) : new Date();
          addLog(logKey, {
            id: msg.logId != null ? String(msg.logId) : `${Date.now()}-${++logCountRef.current}`,
            content: msg.content,
            type: msg.type,
            timestamp: ts,
          });

          // Создаём вкладку терминала если её ещё нет
          const tabKey = `${msg.projectId}_${msg.tokenId}`;
          if (!createdTabsRef.current.has(tabKey)) {
            const hasTab = terminalsRef.current.some(
              t => t.projectId === msg.projectId && t.tokenId === msg.tokenId && t.tabType !== 'history'
            );
            if (!hasTab) {
              addTerminal({
                projectId: msg.projectId,
                tokenId: msg.tokenId,
                botName: resolveBotDisplayNameFromCache(queryClient, msg.projectId, msg.tokenId),
                isRunning: true,
              });
            }
            createdTabsRef.current.add(tabKey);
          }
          return;
        }

        if (
          msg.type === 'token-created'
          || msg.type === 'token-deleted'
          || msg.type === 'token-updated'
        ) {
          handleTokenEvent(queryClient, msg, onTokenCreatedRef.current);
        }
        if (msg.type === 'bot-started' || msg.type === 'bot-stopped' || msg.type === 'bot-error') {
          handleBotEvent(queryClient, msg);
        }
        if (msg.type === 'bot-started' && msg.tokenId) {
          onBotStartedRef.current?.(msg.projectId, msg.tokenId);
        }
        if (msg.type === 'start-offline-progress') {
          handleStartOfflineProgress(queryClient, msg);
        }
      } catch {
        // Игнорируем некорректные сообщения
      }
    });

    return () => {
      unsubscribe();
      unsubscribeReconnect();
    };
  }, [queryClient, addLog, addTerminal]);
}
