/** @fileoverview Проверки общей живой истории пользователя и безопасности группового контекста. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useDialogLiveMessages } from './use-dialog-live-messages';
import { canActOnDialogMessage, isDialogListCache } from '../utils/dialog-message-source';

const mocks = vi.hoisted(() => ({ listener: null as null | ((event: unknown) => void),
  context: { subscribe: vi.fn() } }));
vi.mock('@/components/editor/database/user-database/contexts/user-messages-live-context', () => ({
  useUserMessagesLiveContext: () => mocks.context,
}));
vi.mock('@/lib/shared-terminal-ws', () => ({ subscribeSharedTerminalWs: vi.fn() }));

beforeEach(() => {
  mocks.listener = null;
  mocks.context.subscribe.mockImplementation((listener) => { mocks.listener = listener; return vi.fn(); });
});

/**
 * Отправляет тестовое событие нового сообщения подписчику.
 * @param overrides - Изменения источника и направления сообщения
 * @param tokenId - Токен события
 * @param projectId - Проект события
 */
function publish(overrides: Record<string, unknown> = {}, tokenId = 9, projectId = 12) {
  act(() => mocks.listener?.({ type: 'new-message', projectId, tokenId,
    data: { id: 1, userId: '42', messageType: 'user', messageText: 'Привет',
      createdAt: '2026-10-14T00:00:00Z', chatType: 'private', ...overrides } }));
}

it('сохраняет групповой источник автора и исключает ответы бота в группе', () => {
  const { result } = renderHook(() => useDialogLiveMessages(12, 9, '42'));
  publish({ chatType: 'supergroup', chatId: '-1001' });
  publish({ id: 2, chatType: 'supergroup', chatId: '-1001', messageType: 'bot' });
  publish({ id: 3, chatType: 'supergroup', chatId: '-1001', userId: '43' });
  expect(result.current.liveMessages).toHaveLength(1);
  expect(result.current.liveMessages[0]).toMatchObject({ chatType: 'supergroup', chatId: '-1001' });
});

it('не смешивает ботов, проекты и события без идентификатора выбранного бота', () => {
  const { result } = renderHook(() => useDialogLiveMessages(12, 9, '42'));
  publish({}, 10); publish({}, 9, 13);
  act(() => mocks.listener?.({ type: 'new-message', projectId: 12, data: { userId: '42' } }));
  expect(result.current.liveMessages).toHaveLength(0);
  publish();
  expect(result.current.liveMessages).toHaveLength(1);
});

it('групповой чат продолжает показывать сообщения разных участников и ответы бота', () => {
  const { result } = renderHook(() => useDialogLiveMessages(12, 9, '-1001', '-1001'));
  publish({ chatType: 'supergroup', chatId: '-1001', userId: '43', messageType: 'bot' });
  expect(result.current.liveMessages).toHaveLength(1);
});

it('групповой контекст в личке не допускает действий с чужим chat_id', () => {
  expect(canActOnDialogMessage(false, 'supergroup')).toBe(false);
  expect(canActOnDialogMessage(false, 'group')).toBe(false);
  expect(canActOnDialogMessage(false, 'private')).toBe(true);
  expect(canActOnDialogMessage(true, 'supergroup')).toBe(true);
});

it('различает кэш списка диалогов и таблицы всех пользователей', () => {
  expect(isDialogListCache(['infinite-users', 12, 9, '', null, '', '', false, 'users'])).toBe(true);
  expect(isDialogListCache(['infinite-users', 12, 9, '', null, '', '', true])).toBe(true);
  expect(isDialogListCache(['infinite-users', 12, 9])).toBe(false);
});
