/** @fileoverview Общий кэш доступа и названий групп для списка и шапки. */
import { QueryClient } from '@tanstack/react-query';
import { requestGroupSyncDetails, type GroupAccessData } from './group-sync-request';

/**
 * Формирует ключ, изолированный по проекту, боту и чату.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param chatId - Чат
 * @returns Ключ кэша
 */
export function groupAccessKey(projectId: number, tokenId: number | null | undefined, chatId: string) {
  return ['group-access', projectId, tokenId ?? null, chatId] as const;
}

/**
 * Выполняет одну проверку и сразу обновляет данные всех подписчиков.
 * @param client - Общий клиент запросов
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param chatId - Чат
 * @returns Состояние группы
 */
export async function checkGroupAccess(client: QueryClient, projectId: number,
  tokenId: number | null | undefined, chatId: string) {
  const key = groupAccessKey(projectId, tokenId, chatId);
  const previous = client.getQueryData<GroupAccessData>(key);
  if (previous?.status === 'checking') return previous;
  client.setQueryData(key, { ...previous, status: 'checking' });
  const result = await requestGroupSyncDetails(projectId, chatId, tokenId);
  const next = { ...previous, ...result };
  client.setQueryData(key, next);
  return next;
}
