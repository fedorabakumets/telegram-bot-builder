/** @fileoverview Подписка карточки и шапки на общую проверку группы. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkGroupAccess, groupAccessKey } from './group-access-cache';
import type { GroupAccessData } from './group-sync-request';
import type { BotToken } from '@shared/schema';
import { botAvailabilityLabel } from '@shared/bot-availability-label';

/**
 * Читает общий кэш, не обращаясь к Telegram автоматически.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param chatId - Чат
 * @param chatType - Тип чата
 * @returns Общие данные и ручная проверка
 */
export function useGroupAccess(projectId: number, tokenId: number | null | undefined,
  chatId: string, chatType = 'group') {
  const client = useQueryClient();
  /** Читает уже загруженный справочник, не выполняя запрос для каждой карточки. */
  const { data: tokens } = useQuery<BotToken[]>({ queryKey: [`/api/projects/${projectId}/tokens`], enabled: false });
  const token = tokens?.find(item => item.id === tokenId);
  const botAvailability = token ? botAvailabilityLabel(token.authorizationError, token.isActive) : null;
  const { data } = useQuery<GroupAccessData>({ queryKey: groupAccessKey(projectId, tokenId, chatId),
    queryFn: async () => client.getQueryData<GroupAccessData>(groupAccessKey(projectId, tokenId, chatId)) ?? { status: 'unknown' },
    enabled: false, staleTime: Infinity, gcTime: Infinity });
  /** Запускает явную проверку и обновляет серверный список диалогов. */
  const check = async () => {
    await checkGroupAccess(client, projectId, tokenId, chatId, chatType);
    await client.refetchQueries({ queryKey: ['infinite-users', projectId] });
  };
  return { data, check, botAvailability };
}
