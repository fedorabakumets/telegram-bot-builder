/**
 * @fileoverview Тесты для хука useBotData
 * Проверяет загрузку данных бота и обработку ошибок
 * @module tests/unit/hooks/use-bot-data.test
 */

/// <reference types="vitest/globals" />

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBotData } from '../../../hooks/use-bot-data';

// Мокируем fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

/**
 * Создаёт тестовый QueryClient с default queryFn
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60 * 1000, // 1 минута как в продакшене
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

describe('useBotData', () => {
  it('должен возвращать undefined при отсутствии projectId', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    
    const { result } = renderHook(() => useBotData(0), { wrapper });

    // Запрос не должен выполняться для projectId = 0
    expect(result.current.isLoading).toBe(false);
    expect(result.current.bot).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('должен загружать данные бота успешно', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockBotData = {
      userId: 123,
      firstName: 'Test Bot',
      lastName: null,
      userName: 'test_bot',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBotData,
    } as any);

    const { result } = renderHook(() => useBotData(1), { wrapper });

    // Начальное состояние
    expect(result.current.isLoading).toBe(true);
    expect(result.current.bot).toBeUndefined();

    // Ожидаем загрузку
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bot).toEqual(mockBotData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/bot/data')
    );
  });

  it('должен обрабатывать ошибку загрузки', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);

    const { result } = renderHook(() => useBotData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bot).toBeUndefined();
  });

  it('должен обрабатывать невалидные данные', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => 'invalid-data',
    } as any);

    const { result } = renderHook(() => useBotData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bot).toBeNull();
  });

  it('должен кэшировать данные', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const mockBotData = {
      userId: 123,
      firstName: 'Cached Bot',
      lastName: null,
      userName: 'cached_bot',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBotData,
    } as any);

    // Первая загрузка
    const { result: result1 } = renderHook(() => useBotData(1), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));
    expect(result1.current.bot).toEqual(mockBotData);

    // Вторая загрузка (должно быть из кэша)
    const { result: result2 } = renderHook(() => useBotData(1), { wrapper });
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.bot).toEqual(mockBotData);

    // Fetch должен быть вызван только один раз
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
