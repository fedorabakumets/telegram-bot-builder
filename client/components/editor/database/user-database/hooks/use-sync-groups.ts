/**
 * @fileoverview Хук синхронизации названий и аватарок групп из Telegram
 * При монтировании запрашивает список групп проекта и синкает каждую через Bot API
 * @module client/components/editor/database/user-database/hooks/use-sync-groups
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BotGroup } from '@shared/schema';

/**
 * Синхронизирует данные групп (название, аватарка) из Telegram Bot API.
 * Запускается один раз при монтировании компонента.
 * После синка инвалидирует кэш групп и список диалогов.
 *
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена (для инвалидации кэша)
 */
export function useSyncGroups(projectId: number, selectedTokenId?: number | null): void {
    const queryClient = useQueryClient();
    const syncedRef = useRef(false);

    // Загружаем список групп проекта
    const { data: groups } = useQuery<BotGroup[]>({
        queryKey: [`/api/projects/${projectId}/groups`],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/groups`, {
                credentials: 'include',
            });
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 60_000,
        enabled: !!projectId,
    });

    useEffect(() => {
        // Синкаем только один раз за сессию монтирования
        if (syncedRef.current) return;
        if (!groups || groups.length === 0) return;

        syncedRef.current = true;

        /**
         * Синкает каждую группу у которой есть group_id (Telegram chat_id).
         * Запросы идут параллельно, ошибки не блокируют остальные.
         */
        const syncAll = async () => {
            const groupsWithId = groups.filter((g) => g.groupId);
            if (groupsWithId.length === 0) return;

            await Promise.allSettled(
                groupsWithId.map((g) =>
                    fetch(
                        `/api/projects/${projectId}/groups/${encodeURIComponent(g.groupId!)}/sync`,
                        { method: 'POST', credentials: 'include' }
                    )
                )
            );

            // Инвалидируем кэш групп и список диалогов после синка
            queryClient.invalidateQueries({
                queryKey: [`/api/projects/${projectId}/groups`],
            });
            queryClient.invalidateQueries({
                queryKey: ['infinite-users', projectId],
            });
        };

        syncAll();
    }, [groups, projectId, selectedTokenId, queryClient]);
}
