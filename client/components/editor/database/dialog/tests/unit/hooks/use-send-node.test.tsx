/**
 * @fileoverview Тесты для хука useSendNode
 * Проверяет отправку данных узла и обработку результатов
 * @module tests/unit/hooks/use-send-node.test
 *
 * @description
 * Для тестирования хуков React Query используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/unit/hooks/use-send-node.test.ts
 */

/// <reference types="vitest/globals" />

import { beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useSendNode } from '../../../hooks/use-send-node';
import type { SendNodeData } from '../../../hooks/use-send-node';

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

describe('useSendNode', () => {
  beforeEach(() => {
    mockApiRequest.mockClear();
    mockToast.mockClear();
    vi.clearAllMocks();
  });

  it('должен возвращать мутацию с правильными методами', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('должен успешно отправлять узел', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-node-message',
      {
        nodeId: 'node-123',
        userData: undefined,
      }
    );
    expect(result.current.isSuccess).toBe(true);
  });

  it('должен вызывать toast при успешной отправке', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Узел отправлен',
      description: 'Содержимое узла отправлено пользователю',
    });
  });

  it('должен вызывать onSent при успешной отправке', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const onSent = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1, onSent), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('должен отправлять userData если передано', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
      userData: { name: 'Иван', age: 25 },
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-node-message',
      {
        nodeId: 'node-123',
        userData: { name: 'Иван', age: 25 },
      }
    );
  });

  it('должен обрабатывать ошибку отправки', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to send node'))
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(result.current.isError).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Ошибка',
      description: 'Failed to send node',
      variant: 'destructive',
    });
  });

  it('должен обрабатывать ошибку без сообщения', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.reject(new Error())
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Ошибка',
      description: 'Не удалось отправить узел',
      variant: 'destructive',
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
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    // Начинаем отправку
    const mutatePromise = act(async () => {
      result.current.mutate(sendNodeData);
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
    const { result } = renderHook(() => useSendNode(999), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/999/users/456/send-node-message',
      {
        nodeId: 'node-123',
        userData: undefined,
      }
    );
  });

  it('должен работать с разными userId', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 789,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/789/send-node-message',
      {
        nodeId: 'node-123',
        userData: undefined,
      }
    );
  });

  it('должен работать с разными nodeId', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'different-node',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-node-message',
      {
        nodeId: 'different-node',
        userData: undefined,
      }
    );
  });

  it('должен отправлять пустой userData если не передано', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-node-message',
      {
        nodeId: 'node-123',
        userData: undefined,
      }
    );
  });

  it('должен сбрасывать isError после новой попытки', async () => {
    mockApiRequest
      .mockImplementationOnce(() => Promise.reject(new Error('Failed')))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(result.current.isError).toBe(true);

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('должен обрабатывать сложные userData', async () => {
    mockApiRequest.mockImplementationOnce(() =>
      Promise.resolve({ ok: true })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendNode(1), { wrapper });

    const sendNodeData: SendNodeData = {
      nodeId: 'node-123',
      userId: 456,
      userData: {
        name: 'Иван',
        age: 25,
        preferences: {
          theme: 'dark',
          language: 'ru',
        },
        tags: ['tag1', 'tag2'],
      },
    };

    await act(async () => {
      result.current.mutate(sendNodeData);
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-node-message',
      {
        nodeId: 'node-123',
        userData: {
          name: 'Иван',
          age: 25,
          preferences: {
            theme: 'dark',
            language: 'ru',
          },
          tags: ['tag1', 'tag2'],
        },
      }
    );
  });
});
