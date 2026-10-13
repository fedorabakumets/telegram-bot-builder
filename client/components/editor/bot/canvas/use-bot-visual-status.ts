/**
 * @fileoverview Общий статус анимации бота с ожиданием подтверждения сервера.
 */
import { useEffect, useRef, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { useBotControl } from '../bot-control-context';
import { getBotServiceFailure } from './bot-service-failure';
import { resolveBotCanvasStatus, type BotCanvasStatus } from './bot-canvas-status';

/** Операция, ожидающая подтверждения статуса процесса. */
type Operation = 'starting' | 'stopping' | 'restarting';

/**
 * Синхронизирует визуальные состояния карточки и шапки для конкретного токена.
 * @param tokenId - Идентификатор токена
 * @param projectId - Идентификатор проекта
 * @param isActive - Действительность токена
 * @param isRunning - Подтверждённое состояние процесса
 * @returns Статус для бейджа и анимации
 */
export function useBotVisualStatus(
  tokenId: number, projectId: number, isActive: number | null, isRunning: boolean,
): BotCanvasStatus {
  const { startBotMutation: start, stopBotMutation: stop, restartAllBotsMutation: restart,
    startOfflineAllMutation: bulk, allBotStatuses } = useBotControl();
  const matchesStart = start.variables?.tokenId === tokenId && start.variables.projectId === projectId;
  const matchesStop = stop.variables?.tokenId === tokenId && stop.variables.projectId === projectId;
  const startLatest = (matchesStart ? start.submittedAt ?? 0 : 0)
    >= (matchesStop ? stop.submittedAt ?? 0 : 0);
  const commandError = startLatest ? matchesStart && start.isError : matchesStop && stop.isError;
  const server = allBotStatuses.find(s => (s.tokenId ?? s.instance?.tokenId) === tokenId);
  const failure = !!getBotServiceFailure(server);
  const envRestarting = useIsMutating({ mutationKey: ['bot-env-restart', projectId, tokenId] }) > 0;
  const operation: Operation | null = matchesStop && stop.isPending ? 'stopping'
    : matchesStart && start.isPending ? 'starting'
    : envRestarting || (restart.isPending && restart.variables === projectId) ? 'restarting'
    : bulk.isPending && bulk.variables === projectId && !isRunning ? 'starting' : null;
  const previous = useRef<Operation | null>(null);
  const [waiting, setWaiting] = useState<Operation | null>(null);

  useEffect(() => {
    if (operation) {
      previous.current = operation;
      setWaiting(null);
      return;
    }
    const completed = previous.current;
    previous.current = null;
    if (completed && !commandError && !failure && isRunning !== (completed !== 'stopping')) {
      setWaiting(completed);
    }
  }, [operation, commandError, failure, isRunning]);

  useEffect(() => {
    if (!waiting) return;
    if (commandError || failure || isRunning === (waiting !== 'stopping')) {
      setWaiting(null);
      return;
    }
    // При недоступном обновлении возвращаем реальный статус, не имитируя успех.
    const timer = window.setTimeout(() => setWaiting(null), 15000);
    return () => window.clearTimeout(timer);
  }, [waiting, commandError, failure, isRunning]);

  const completed = previous.current;
  const awaitingConfirmation = completed && !commandError && !failure
    && isRunning !== (completed !== 'stopping') ? completed : null;
  const status = resolveBotCanvasStatus({ isActive, isRunning,
    hasFailure: failure || (!isRunning && !!commandError),
    operation: operation ?? waiting ?? awaitingConfirmation });
  return commandError && !operation && !waiting && status !== 'invalid' ? 'error' : status;
}
