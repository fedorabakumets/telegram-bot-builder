/**
 * @fileoverview Тесты для хука useDialogMessages
 * Проверяет загрузку сообщений и автопрокрутку
 * @module tests/unit/hooks/use-dialog-messages.test
 */

/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDialogMessages } from '../../../hooks/use-dialog-messages';
import type { BotMessageWithMedia } from '../../../types';

// Мокируем fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  vi.clearAllMocks();
});

/**
 * Создаёт тестовый QueryClient с default queryFn
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        queryFn: async ({ queryKey }) => {
          const res = await mockFetch(queryKey[0] as string);
          if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          return res.json();
        },
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков
 */
function createWrapper(queryClient: QueryClient) {
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
  it('должен возвращать пустой массив если userId не указан', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useDialogMessages(1, undefined), { wrapper });

    // Запрос не должен выполняться
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('должен загружать сообщения успешно', async () => {
    const mockMessages = [
      createTestMessage({ id: 1, messageText: 'Hello' }),
      createTestMessage({ id: 2, messageText: 'World' }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    } as any);

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
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

  it('должен обрабатывать ошибку загрузки', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('должен обрабатывать пустой список сообщений', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as any);

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('должен возвращать ref для автопрокрутки', async () => {
    const mockMessages = [createTestMessage({ id: 1 })];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    } as any);

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useDialogMessages(1, 123), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messagesScrollRef).toBeDefined();
    expect(result.current.messagesScrollRef.current).toBeNull();
  });
});
