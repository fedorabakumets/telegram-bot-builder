/**
 * @fileoverview Подписка формы юзербота на шаги входа из MCP и других вкладок.
 * @module client/components/editor/bot/card/use-userbot-auth-progress
 */
import { useEffect, useRef } from 'react';
import { subscribeSharedTerminalWs } from '@/lib/shared-terminal-ws';
import { parseUserbotAuthProgress, type UserbotAuthProgress } from '@shared/project-sync/userbot-auth-progress';

/**
 * Подписывается на общий сокет и фильтрует события по проекту и токену.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param onProgress - Обновление локальной формы
 * @returns Ничего
 */
export function useUserbotAuthProgress(
  projectId: number, tokenId: number, onProgress: (progress: UserbotAuthProgress) => void,
): void {
  const callback = useRef(onProgress);
  callback.current = onProgress;
  useEffect(() => {
    /** Последнее событие защищает ввод от повторной доставки */
    let lastEventId: string | undefined;
    return subscribeSharedTerminalWs((value) => {
      if (!value || typeof value !== 'object') return;
      const event = value as Record<string, unknown>;
      if (event.type !== 'userbot-auth-progress' || event.projectId !== projectId || event.tokenId !== tokenId) return;
      if (typeof event.eventId === 'string' && event.eventId === lastEventId) return;
      const progress = parseUserbotAuthProgress(event.data);
      if (progress) {
        lastEventId = typeof event.eventId === 'string' ? event.eventId : undefined;
        callback.current(progress);
      }
    });
  }, [projectId, tokenId]);
}
