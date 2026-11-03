/** @fileoverview Проверка фильтрации событий последнего сообщения по проекту и боту. */
import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useLiveLastMessage } from './use-live-last-message';

/** Перехватывает подписку и запись в кэш без сетевого соединения. */
const mocks = vi.hoisted(() => ({ listener: null as ((event: any) => void) | null, setQueryData: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ setQueryData: mocks.setQueryData }) }));
vi.mock('../../contexts/user-messages-live-context', () => ({
  useUserMessagesLiveContext: () => ({ subscribe: (listener: (event: any) => void) => { mocks.listener = listener; return () => {}; } }),
}));
beforeEach(() => { mocks.listener = null; mocks.setQueryData.mockClear(); });

it('обновляет кэш только сообщением нужного пользователя, проекта и бота', () => {
  renderHook(() => useLiveLastMessage(1, 123, 7));
  const event = { type: 'new-message', projectId: 1, tokenId: 7,
    data: { id: 10, userId: '123', messageType: 'user', messageText: 'Привет', messageData: {}, createdAt: '2026-01-01T00:00:00Z' } };
  mocks.listener?.({ ...event, projectId: 2 });
  mocks.listener?.({ ...event, tokenId: 8 });
  mocks.listener?.({ ...event, type: 'new-user' });
  expect(mocks.setQueryData).not.toHaveBeenCalled();
  mocks.listener?.(event);
  expect(mocks.setQueryData).toHaveBeenCalledTimes(1);
  expect(mocks.setQueryData.mock.calls[0][1]).toMatchObject({ userId: '123', messageText: 'Привет', chatType: 'private', telegramMessageId: null });
});
