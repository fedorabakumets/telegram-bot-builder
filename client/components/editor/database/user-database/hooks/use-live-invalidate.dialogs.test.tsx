/** @fileoverview Проверка живого обновления личных карточек без примеси групп и других ботов. */
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useLiveInvalidate } from './use-live-invalidate';

const mocks = vi.hoisted(() => ({ listener: null as null | ((event: unknown) => void),
  context: { subscribe: vi.fn() } }));
vi.mock('../contexts/user-messages-live-context', () => ({ useUserMessagesLiveContext: () => mocks.context }));
vi.mock('./throttle-users-activity-invalidate', () => ({
  createUsersActivityInvalidator: () => ({ invalidate: vi.fn(), dispose: vi.fn() }),
}));

beforeEach(() => {
  mocks.context.subscribe.mockImplementation((listener) => { mocks.listener = listener; return vi.fn(); });
});

/**
 * Создаёт клиент с личной карточкой и подключает обработку событий.
 * @returns Клиент и ключи кэша разных ботов
 */
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const key = ['infinite-users', 12, 9, '', null, 'lastInteraction', 'desc', false, 'users'];
  const otherKey = [...key]; otherKey[2] = 10;
  const data = { pageParams: [0], pages: [{ users: [{ userId: '42', lastMessageText: 'Личное',
    lastInteraction: new Date('2026-10-01'), interactionCount: 1 }], total: 1, hasMore: false }] };
  client.setQueryData(key, data); client.setQueryData(otherKey, data);
  renderHook(() => useLiveInvalidate({ projectId: 12, selectedTokenId: 9 }), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { client, key, otherKey };
}

/**
 * Отправляет событие нового сообщения.
 * @param chatType - Тип исходного чата
 * @param tokenId - Токен события
 */
function publish(chatType: string, tokenId = 9) {
  act(() => mocks.listener?.({ type: 'new-message', projectId: 12, tokenId,
    data: { userId: '42', messageType: 'user', messageText: 'Новое', chatType,
      createdAt: '2026-10-14T00:00:00Z' } }));
}

it('групповое событие не заменяет превью и дату личной карточки', () => {
  const { client, key } = setup();
  const before = client.getQueryData(key);
  publish('supergroup');
  expect(client.getQueryData(key)).toEqual(before);
});

it('личное событие обновляет только карточку выбранного бота', () => {
  const { client, key, otherKey } = setup();
  const otherBefore = client.getQueryData(otherKey);
  publish('private');
  expect((client.getQueryData(key) as any).pages[0].users[0].lastMessageText).toBe('Новое');
  expect(client.getQueryData(otherKey)).toEqual(otherBefore);
});

it('new-user без подтверждённой личной истории не вставляется в диалоги', () => {
  const { client, key } = setup();
  act(() => mocks.listener?.({ type: 'new-user', projectId: 12, tokenId: 9,
    data: { userId: '43', isBot: 0, registeredAt: '2026-10-14T00:00:00Z' } }));
  expect((client.getQueryData(key) as any).pages[0].users).toHaveLength(1);
});
