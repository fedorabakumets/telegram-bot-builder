/**
 * @fileoverview Хук подписки на событие projects-changed через общий owner-канал.
 * При получении сигнала инвалидирует кэш списка проектов, чтобы шапка
 * (ProjectSwitcher), домашняя страница и сайдбар обновились в реальном времени
 * без перезагрузки страницы. Использует общий singleton WS (projectId=0),
 * который сервер идентифицирует по сессии как owner-канал `user_<userId>`.
 * @module client/hooks/use-projects-changed-ws
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeSharedTerminalWs } from '@/lib/shared-terminal-ws';
import { isProjectsChangedMessage } from '@shared/project-sync/projects-changed-message';

/**
 * Подписывается на событие projects-changed и инвалидирует кэш проектов.
 * Подписка глобальна и не зависит от открытого проекта/вкладки.
 */
export function useProjectsChangedWs(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeSharedTerminalWs((raw) => {
      if (!isProjectsChangedMessage(raw)) return;
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    });
    return unsubscribe;
  }, [queryClient]);
}
