/** @fileoverview Подписка карточки сообщений на общий сокет без дополнительных соединений и опроса. */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeSharedTerminalWs, onSharedTerminalWsReconnect } from '@/lib/shared-terminal-ws';
import { subscribeMessageActivity } from './message-activity-live';

/**
 * Обновляет все периоды карточки при новых сообщениях, удалении и восстановлении связи.
 * @param projectId - Открытый проект.
 * @param tokenId - Выбранный бот или все боты.
 */
export function useMessageActivityLive(projectId: number, tokenId?: number | null): void {
  const client = useQueryClient();
  useEffect(() => subscribeMessageActivity(client, projectId, tokenId,
    listener => subscribeSharedTerminalWs(raw => {
      if (raw && typeof raw === 'object' && 'type' in raw && 'projectId' in raw) {
        listener(raw as { type: string; projectId: number; tokenId?: number });
      }
    }), onSharedTerminalWsReconnect), [client, projectId, tokenId]);
}
