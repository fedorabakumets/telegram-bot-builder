/**
 * @fileoverview Хук синхронизации названий и аватарок групп из Telegram
 * Берёт уникальные chat_id из списка диалогов (bot_messages) и синкает каждую через Bot API.
 * После синка название и аватарка подтягиваются из bot_groups через LEFT JOIN в SQL.
 * @module client/components/editor/database/user-database/hooks/use-sync-groups
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Синхронизирует данные групп (название, аватарка) из Telegram Bot API.
 * Запускается один раз при монтировании. Принимает список диалогов напрямую
 * чтобы не делать лишний запрос к /api/projects/:id/groups.
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
    const syncedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!dialogs || dialogs.length === 0) return;

        // Берём только группы у которых ещё не синкали в этой сессии
        const groups = dialogs.filter(
            (d) => (d as any).isGroup && d.userId && !syncedRef.current.has(String(d.userId))
        );
        if (groups.length === 0) return;

        groups.forEach((g) => syncedRef.current.add(String(g.userId)));

        /**
         * Синкает каждую группу параллельно через POST /sync.
         * После завершения инвалидирует кэш списка диалогов.
         */
        const syncAll = async () => {
            await Promise.allSettled(
                groups.map((g) =>
                    fetch(
                        `/api/projects/${projectId}/groups/${encodeURIComponent(String(g.userId))}/sync`,
                        { method: 'POST', credentials: 'include' }
                    )
                )
            );

            // Немедленно перезапрашиваем список диалогов — подтянутся обновлённые названия и аватарки
            await queryClient.refetchQueries({
                queryKey: ['infinite-users', projectId],
            });
        };

        syncAll();
    }, [dialogs, projectId, selectedTokenId, queryClient]);
}
