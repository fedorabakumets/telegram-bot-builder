/** @fileoverview Обновление ленты после изменения отправленных сообщений из другой вкладки или API. */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';

/**
 * Объединяет события правки в одно обновление после сохранения итогов рассылки.
 * @param projectId - Проект текущей ленты
 * @returns Ничего
 */
export function useBroadcastEditRefresh(projectId: number): void {
  const client = useQueryClient();
  const live = useUserMessagesLiveContext();
  useEffect(() => {
    if (!live) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = live.subscribe(event => {
      if (event.type !== 'message-edited' || event.projectId !== projectId) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        void client.invalidateQueries({ predicate: query => {
          const key = query.queryKey[0];
          return typeof key === 'string' && /^\/api\/projects\/\d+\/broadcast(?:s|(-campaigns))(?:\?|\/|$)/.test(key)
            && key.startsWith(`/api/projects/${projectId}/`);
        } });
      }, 500);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [client, live, projectId]);
}
