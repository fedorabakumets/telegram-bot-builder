/**
 * @fileoverview Хук синхронизации названий и аватарок групп из Telegram
 * Берёт группы из текущего списка диалогов и синкает через Bot API выбранным токеном.
 * @module client/.../hooks/use-sync-groups
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Синхронизирует данные групп (название, аватарка) из Telegram Bot API.
 * Помечает группу синкнутой только при успешном ответе; при смене токена — ретрай.
 *
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param dialogs - Список диалогов (включая группы с isGroup=true)
 */
export function useSyncGroups(
  projectId: number,
  selectedTokenId?: number | null,
  dialogs?: UserBotData[],
): void {
  const queryClient = useQueryClient();
  /** Ключ `${tokenId}:${groupId}` уже успешно синкнутых */
  const syncedRef = useRef<Set<string>>(new Set());
  /** Предыдущий токен — сброс кэша синка при смене бота */
  const prevTokenRef = useRef<number | null | undefined>(selectedTokenId);

  useEffect(() => {
    if (prevTokenRef.current !== selectedTokenId) {
      syncedRef.current.clear();
      prevTokenRef.current = selectedTokenId;
    }
  }, [selectedTokenId]);

  useEffect(() => {
    if (!dialogs || dialogs.length === 0) return;

    const tokenKey = selectedTokenId ?? 'all';
    const groups = dialogs.filter((d) => {
      const meta = d as UserBotData & { isGroup?: boolean };
      if (!meta.isGroup || !d.userId) return false;
      return !syncedRef.current.has(`${tokenKey}:${d.userId}`);
    });
    if (groups.length === 0) return;

    const syncAll = async () => {
      const tokenQs =
        selectedTokenId != null ? `?tokenId=${selectedTokenId}` : '';

      const results = await Promise.allSettled(
        groups.map(async (g) => {
          const response = await fetch(
            `/api/projects/${projectId}/groups/${encodeURIComponent(String(g.userId))}/sync${tokenQs}`,
            { method: 'POST', credentials: 'include' },
          );
          if (!response.ok) {
            throw new Error(`sync failed ${response.status}`);
          }
          syncedRef.current.add(`${tokenKey}:${g.userId}`);
        }),
      );

      const anyOk = results.some((r) => r.status === 'fulfilled');
      if (anyOk) {
        await queryClient.refetchQueries({
          queryKey: ['infinite-users', projectId],
        });
      }
    };

    void syncAll();
  }, [dialogs, projectId, selectedTokenId, queryClient]);
}
