/** @fileoverview Согласованное обновление авторизации, списков и статусов после изменения токена или реконнекта. */
import type { QueryClient } from '@tanstack/react-query';
import { invalidateAllBotStatusQueries, invalidateBotStatusQueries } from '@/components/editor/bot/invalidate-bot-status-queries';

/** Сбрасывает снимки токенов и профилей, которые могли устареть при замене секрета или пропуске WS. */
export function invalidateTokenMetadata(client: QueryClient, projectId?: number, tokenId?: number): void {
  client.invalidateQueries({ predicate: ({ queryKey }) => {
    const key = queryKey[0];
    if (typeof key !== 'string') return false;
    const match = /^\/api\/projects\/(\d+)\/(?:tokens(?:\/list)?|bot\/info)$/.exec(key);
    return Boolean(match && (projectId === undefined || Number(match[1]) === projectId));
  } });
  client.invalidateQueries({ queryKey: ['/api/projects'] });
  if (projectId === undefined) invalidateAllBotStatusQueries(client);
  else invalidateBotStatusQueries(client, projectId, tokenId);
}
