/**
 * @fileoverview Проверки удаления уже сохранённых изменений юзербота из очереди.
 * @module client/components/editor/bot/card/use-userbot-pending-sync.test
 */
import { useState } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import type { PendingChange } from './use-env-pending-changes';
import { reconcileUserbotPending, useUserbotPendingSync } from './use-userbot-pending-sync';

/**
 * Создаёт очередь с изменением юзербота и независимой настройкой.
 * @param value - Значение режима
 * @returns Локальная очередь
 */
function pendingChanges(value: string): Map<string, PendingChange> {
  return new Map([
    ['USERBOT_ENABLED', { action: 'update', type: 'system', key: 'USERBOT_ENABLED', value }],
    ['OTHER', { action: 'update', type: 'custom', key: 'OTHER', value: 'draft' }],
  ]);
}

afterEach(cleanup);

describe('сверка очереди юзербота', () => {
  it.each([['true', 1], ['1', 1], ['false', 0], ['0', null]] as const)('удаляет сохранённое значение %s и сохраняет остальные изменения', (value, enabled) => {
    const changes = pendingChanges(value);
    const result = reconcileUserbotPending(changes, enabled);
    expect(result.has('USERBOT_ENABLED')).toBe(false);
    expect(result.get('OTHER')).toEqual(changes.get('OTHER'));
    expect(changes.size).toBe(2);
  });
  it('сохраняет отличающийся от сервера черновик', () => {
    const changes = pendingChanges('false');
    expect(reconcileUserbotPending(changes, 1)).toBe(changes);
  });
  it('реагирует на обновление кэша токенов после WebSocket', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { queryFn: async () => [] } } });
    client.setQueryData(['/api/projects/289/tokens'], [{ id: 294, userbotEnabled: 0 }]);
    const hook = renderHook(() => {
      const [changes, setChanges] = useState(() => pendingChanges('true'));
      useUserbotPendingSync(289, 294, changes, setChanges);
      return changes;
    }, {
      /** Подключает тестовую очередь к серверному кэшу */
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    expect(hook.result.current.size).toBe(2);
    act(() => client.setQueryData(['/api/projects/289/tokens'], [{ id: 294, userbotEnabled: 1 }]));
    await waitFor(() => expect(hook.result.current.size).toBe(1));
    expect(hook.result.current.has('OTHER')).toBe(true);
  });
});
