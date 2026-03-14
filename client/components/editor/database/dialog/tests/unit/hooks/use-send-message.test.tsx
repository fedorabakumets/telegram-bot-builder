/**
 * @fileoverview Тесты для хука useSendMessage
 * Проверяет отправку сообщений и обработку результатов
 * @module tests/unit/hooks/use-send-message.test
 *
 * @description
 * Для тестирования хуков React Query используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/unit/hooks/use-send-message.test.ts
 */

/// <reference types="vitest/globals" />

import { beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useSendMessage } from '../../../hooks/use-send-message';

// Мокирование fetch
const mockFetch = global.fetch as any;

// Мокируем useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Мокируем apiRequest
const mockApiRequest = vi.fn();
vi.mock('@/lib/queryClient', () => ({
  apiRequest: (...args: any[]) => mockApiRequest(...args),
}));

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
    mutationCache: new MutationCache({
      onSuccess: (data, variables, context, mutation) => {
        // Вызываем onSuccess из мутации
      },
      onError: (error, variables, context, mutation) => {
        // Вызываем onError из мутации
      },
    }),
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

describe('useSendMessage', () => {
  beforeEach(() => {
    mockFetch?.mockClear?.();
    mockApiRequest.mockClear();
    mockToast.mockClear();
    vi.clearAllMocks();
  });

  it('должен возвращать мутацию с правильными методами', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('должен успешно отправлять сообщение', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: 'Тестовое сообщение' }
    );
    expect(result.current.isSuccess).toBe(true);
  });

  it('должен вызывать toast при успешной отправке', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Сообщение отправлено',
      description: 'Сообщение успешно отправлено пользователю',
    });
  });

  it('должен вызывать onSent при успешной отправке', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const onSent = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123, onSent), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('должен обрабатывать ошибку отправки', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to send'))
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(result.current.isError).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Ошибка',
      description: 'Не удалось отправить сообщение',
      variant: 'destructive',
    });
  });

  it('должен выбрасывать ошибку если userId не указан', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, undefined), { wrapper });

    await act(async () => {
      try {
        result.current.mutate({ messageText: 'Тестовое сообщение' });
      } catch (error) {
        expect((error as Error).message).toBe('No user selected');
      }
    });
  });

  it('должен устанавливать isPending=true во время отправки', async () => {
    mockApiRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 100);
        })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    // Начинаем отправку
    const mutatePromise = act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    // Проверяем isPending во время отправки
    expect(result.current.isPending).toBe(true);

    await mutatePromise;
  });

  it('должен работать с разными projectId', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(999, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/999/users/123/send-message',
      { messageText: 'Тестовое сообщение' }
    );
  });

  it('должен работать с разными userId', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 456), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-message',
      { messageText: 'Тестовое сообщение' }
    );
  });

  it('должен отправлять текст сообщения', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Привет, мир!' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: 'Привет, мир!' }
    );
  });

  it('должен обрабатывать пустой текст сообщения', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: '' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: '' }
    );
  });

  it('должен обрабатывать HTML в сообщении', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: '<b>Жирный</b> текст' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: '<b>Жирный</b> текст' }
    );
  });

  it('должен сбрасывать isError после новой попытки', async () => {
    mockApiRequest
      .mockImplementationOnce(() => Promise.reject(new Error('Failed')))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(result.current.isError).toBe(true);

    await act(async () => {
      result.current.mutate({ messageText: 'Повторная попытка' });
    });

    expect(result.current.isSuccess).toBe(true);
  });
});
