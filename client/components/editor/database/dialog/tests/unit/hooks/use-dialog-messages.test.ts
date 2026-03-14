/**
 * @fileoverview Тесты для хука useDialogMessages
 * Проверяет загрузку сообщений и автопрокрутку
 * @module tests/unit/hooks/use-dialog-messages.test
 *
 * @description
 * Для тестирования требуется Vitest и @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/unit/hooks/use-dialog-messages.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDialogMessages } from '../../hooks/use-dialog-messages';
import type { BotMessageWithMedia } from '../../types';

// Мокирование fetch
const mockFetch = global.fetch as any;

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        logger: {
          log: console.log,
          warn: console.warn,
          error: () => {},
        },
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Создаёт тестовое сообщение
 */
function createTestMessage(overrides: Partial<BotMessageWithMedia> = {}): BotMessageWithMedia {
  return {
    id: 1,
    createdAt: new Date('2024-03-14T10:30:00Z'),
    projectId: 1,
    userId: '123',
    messageType: 'bot',
    messageText: 'Test message',
    messageData: null,
    nodeId: null,
    primaryMediaId: null,
    ...overrides,
  };
}

describe('useDialogMessages', () => {
  beforeEach(() => {
    mockFetch?.mockClear?.();
    vi.clearAllMocks();
  });

  it('должен загружать сообщения успешно', async () => {
    const mockMessages = [
      createTestMessage({ id: 1, messageText: 'Hello' }),
      createTestMessage({ id: 2, messageText: 'World' }),
    ];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    // Начальное состояние
    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages).toEqual([]);

    // Ожидаем загрузку
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.messagesScrollRef).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/users/123/messages')
    );
  });

  it('должен возвращать пустой массив если userId не указан', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDialogMessages(1, undefined), { wrapper });

    // Запрос не должен выполняться
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('должен обрабатывать ошибку загрузки', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('должен обрабатывать пустой список сообщений', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('должен кэшировать данные', async () => {
    const mockMessages = [createTestMessage({ id: 1 })];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
    );

    const wrapper = createWrapper();

    // Первая загрузка
    const { result: result1 } = renderHook(() => useDialogMessages(1, 123), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Вторая загрузка (из кэша)
    const { result: result2 } = renderHook(() => useDialogMessages(1, 123), { wrapper });
    await waitFor(() => expect(result2.current.isLoading).toBe(false));

    // Fetch вызван только один раз
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('должен выполнять повторный запрос при изменении userId', async () => {
    const mockMessages1 = [createTestMessage({ id: 1, userId: '123' })];
    const mockMessages2 = [createTestMessage({ id: 2, userId: '456' })];

    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages1),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages2),
        })
      );

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ userId }) => useDialogMessages(1, userId),
      { wrapper, initialProps: { userId: 123 } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toHaveLength(1);

    // Изменяем userId
    rerender({ userId: 456 });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('должен возвращать ref для автопрокрутки', async () => {
    const mockMessages = [createTestMessage({ id: 1 })];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messagesScrollRef).toBeDefined();
    expect(result.current.messagesScrollRef.current).toBeNull();
  });
});
