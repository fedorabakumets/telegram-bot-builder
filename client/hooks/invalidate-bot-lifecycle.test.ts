/** @fileoverview Проверки синхронизации автоостанова замороженного бота без потери причины Telegram. */
import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { invalidateBotLifecycle, invalidateLaunchHistories } from './invalidate-bot-lifecycle';

it('обновляет обе формы статуса и историю, сохраняя frozen до ответа сервера', () => {
  const client = new QueryClient();
  const status = { isRunning: false, frozen: true };
  const keys = [['/api/projects/12/bot/statuses'], ['/api/tokens/58/bot-status'], ['launch-history', 58]];
  for (const key of keys) client.setQueryData(key, status);
  client.setQueryData(['launch-history', 59], []);
  invalidateBotLifecycle(client, 12, 58);
  for (const key of keys) {
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryData(key)).toEqual(status);
  }
  expect(client.getQueryState(['launch-history', 59])?.isInvalidated).toBe(false);
});

it('после реконнекта перечитывает все истории с пропущенным окончанием запуска', () => {
  const client = new QueryClient();
  for (const tokenId of [58, 59]) client.setQueryData(['launch-history', tokenId], [{ status: 'running' }]);
  invalidateLaunchHistories(client);
  for (const tokenId of [58, 59]) expect(client.getQueryState(['launch-history', tokenId])?.isInvalidated).toBe(true);
});
