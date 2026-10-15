/**
 * @fileoverview Подписка на WS-прогресс массовой проверки доступов.
 * @module client/components/editor/analytics/use-chat-access-check-live
 */
import { useEffect, useState } from 'react';
import { toChatAccessCheckProgressPayload, type ChatAccessCheckProgressPayload } from '@shared/project-sync/project-event';
import {
  useUserMessagesLiveContext,
  type ChatAccessCheckLiveEvent,
} from '@/components/editor/database/user-database/contexts/user-messages-live-context';

/** Последнее событие по паре проект+токен в рамках сессии вкладки. */
const progressCache = new Map<string, ChatAccessCheckProgressPayload>();

/**
 * Ключ кеша прогресса.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Строковый ключ
 */
function cacheKey(projectId: number, tokenId: number): string {
  return `${projectId}:${tokenId}`;
}

/**
 * Слушает chat-access-check-progress выбранного бота.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот или null
 * @returns Последний безопасный payload
 */
export function useChatAccessCheckLive(projectId: number, tokenId: number | null) {
  const live = useUserMessagesLiveContext();
  const [progress, setProgress] = useState<ChatAccessCheckProgressPayload | null>(() => (
    tokenId ? progressCache.get(cacheKey(projectId, tokenId)) ?? null : null
  ));

  useEffect(() => {
    setProgress(tokenId ? progressCache.get(cacheKey(projectId, tokenId)) ?? null : null);
    if (!live || !tokenId) return undefined;
    return live.subscribe((msg) => {
      if (msg.type !== 'chat-access-check-progress' || msg.projectId !== projectId) return;
      const event = msg as ChatAccessCheckLiveEvent;
      if (event.data.tokenId !== tokenId && event.tokenId !== tokenId) return;
      const next = toChatAccessCheckProgressPayload(event.data);
      progressCache.set(cacheKey(projectId, tokenId), next);
      setProgress(next);
    });
  }, [live, projectId, tokenId]);

  return { progress };
}
