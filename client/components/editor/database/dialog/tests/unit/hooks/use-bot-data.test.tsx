/**
 * @fileoverview Тесты для хука useBotData
 * Проверяет загрузку данных бота и обработку ошибок
 * @module tests/unit/hooks/use-bot-data.test
 *
 * @description
 * Для тестирования хуков React Query используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/unit/hooks/use-bot-data.test.ts
 */

/// <reference types="vitest/globals" />

import { beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBotData } from '../../../hooks/use-bot-data';

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
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков с QueryClient
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBotData', () => {
  beforeEach(() => {
    mockFetch?.mockClear?.();
  });

  it('должен загружать данные бота успешно', async () => {
    const mockBotData = {
      userId: 123,
      firstName: 'Test Bot',
      lastName: null,
      userName: 'test_bot',
    };

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBotData),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBotData(1), { wrapper });

    // Начальное состояние
    expect(result.current.isLoading).toBe(true);
    expect(result.current.bot).toBeNull();

    // Ожидаем загрузку
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bot).toEqual(mockBotData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/bot/data')
    );
  });

  it('должен возвращать null при отсутствии projectId', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useBotData(0), { wrapper });

    // Запрос не должен выполняться для projectId = 0
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bot).toBeNull();
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
    const { result } = renderHook(() => useBotData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bot).toBeNull();
  });

  it('должен обрабатывать невалидные данные', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve('invalid-data'),
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBotData(1), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bot).toBeNull();
  });

  it('должен кэшировать данные', async () => {
    const mockBotData = {
      userId: 123,
      firstName: 'Cached Bot',
      lastName: null,
      userName: 'cached_bot',
    };

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBotData),
      })
    );

    const wrapper = createWrapper();

    // Первая загрузка
    const { result: result1 } = renderHook(() => useBotData(1), { wrapper });
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    // Вторая загрузка (должно быть из кэша)
    const { result: result2 } = renderHook(() => useBotData(1), { wrapper });
    await waitFor(() => expect(result2.current.isLoading).toBe(false));

    // Fetch должен быть вызван только один раз
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
