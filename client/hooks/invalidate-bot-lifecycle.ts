/** @fileoverview Обновление истории и статусов после событий жизненного цикла и пропущенного автоостанова. */
import type { QueryClient } from '@tanstack/react-query';
import { invalidateBotStatusQueries } from '@/components/editor/bot/invalidate-bot-status-queries';

/** Обновляет историю текущего бота или все открывавшиеся истории после реконнекта WS. */
export function invalidateLaunchHistories(client: QueryClient, tokenId?: number): void {
  void client.invalidateQueries({ queryKey: tokenId == null ? ['launch-history'] : ['launch-history', tokenId] });
}

/** Перечитывает статус с сохранённым признаком frozen и завершение запуска без оптимистичного сброса причины. */
export function invalidateBotLifecycle(client: QueryClient, projectId: number, tokenId?: number): void {
  invalidateLaunchHistories(client, tokenId);
  invalidateBotStatusQueries(client, projectId, tokenId);
  void client.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/info`] });
}
