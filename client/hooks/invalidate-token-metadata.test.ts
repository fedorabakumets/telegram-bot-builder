/** @fileoverview Проверки устранения устаревшей ошибки авторизации и статуса после замены токена. */
import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { invalidateTokenMetadata } from './invalidate-token-metadata';

it('инвалидирует токен, профиль и оба статуса после события замены', () => {
  const client = new QueryClient();
  const keys = ['/api/projects/12/tokens', '/api/projects/12/tokens/list', '/api/projects/12/bot/info',
    '/api/projects/12/bot/statuses', '/api/tokens/58/bot-status'];
  for (const key of keys) client.setQueryData([key], { authorizationError: 'unauthorized', frozen: true });
  client.setQueryData(['/api/projects/99/tokens'], []);
  invalidateTokenMetadata(client, 12, 58);
  for (const key of keys) expect(client.getQueryState([key])?.isInvalidated).toBe(true);
  expect(client.getQueryState(['/api/projects/99/tokens'])?.isInvalidated).toBe(false);
});

it('после реконнекта обновляет метаданные всех проектов', () => {
  const client = new QueryClient();
  for (const id of [12, 99]) client.setQueryData([`/api/projects/${id}/tokens`], []);
  invalidateTokenMetadata(client);
  for (const id of [12, 99]) expect(client.getQueryState([`/api/projects/${id}/tokens`])?.isInvalidated).toBe(true);
});
