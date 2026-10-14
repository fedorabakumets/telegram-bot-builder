/** @fileoverview Подписка карточки и шапки на общую проверку группы. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkGroupAccess, groupAccessKey } from './group-access-cache';
import type { GroupAccessData } from './group-sync-request';

/**
 * Читает общий кэш, не обращаясь к Telegram автоматически.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param chatId - Чат
 * @returns Общие данные и ручная проверка
 */
export function useGroupAccess(projectId: number, tokenId: number | null | undefined, chatId: string) {
  const client = useQueryClient();
  const { data } = useQuery<GroupAccessData>({ queryKey: groupAccessKey(projectId, tokenId, chatId),
    queryFn: async () => client.getQueryData<GroupAccessData>(groupAccessKey(projectId, tokenId, chatId)) ?? { status: 'unknown' },
    enabled: false, staleTime: Infinity, gcTime: Infinity });
  /** Запускает явную проверку и обновляет серверный список диалогов. */
  const check = async () => {
    await checkGroupAccess(client, projectId, tokenId, chatId);
    await client.refetchQueries({ queryKey: ['infinite-users', projectId] });
  };
  return { data, check };
}
