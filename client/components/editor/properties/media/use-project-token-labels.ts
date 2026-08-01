/**
 * @fileoverview Хук подписей токенов ботов проекта (tokenId → «Имя (@username)»).
 * @module client/components/editor/properties/media/use-project-token-labels
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BotToken } from '@shared/schema';

/**
 * Загружает токены проекта и строит карту подписей для UI file_id.
 * @param projectId - ID проекта (запрос выключен, если не задан)
 * @returns Карта tokenId (string) → человекочитаемая подпись бота
 */
export function useProjectTokenLabels(projectId?: number): Record<string, string> {
  const { data: tokens = [] } = useQuery<BotToken[]>({
    queryKey: ['/api/user/tokens', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/user/tokens?projectId=${projectId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tokens) {
      const name = t.name || 'Бот';
      map[String(t.id)] = t.botUsername ? `${name} (@${t.botUsername})` : name;
    }
    return map;
  }, [tokens]);
}
