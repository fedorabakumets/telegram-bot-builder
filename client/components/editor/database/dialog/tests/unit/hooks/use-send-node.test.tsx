/**
 * @fileoverview Тесты для хука useSendNode
 * Проверяет отправку данных узла и обработку результатов
 * @module tests/unit/hooks/use-send-node.test
 */

/// <reference types="vitest/globals" />

// Моки должны быть до импортов
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendNode, type SendNodeData } from '../../../hooks/use-send-node';
import { apiRequest } from '@/lib/queryClient';

const mockApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
  vi.clearAllMocks();
  mockApiRequest.mockClear();
});

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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

  it('должен вызывать onSent при успешной отправке', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockRejectedValue(new Error('Failed to send node'));

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
  });

  it('должен обрабатывать ошибку без сообщения', async () => {
    mockApiRequest.mockRejectedValue(new Error());

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
  });

  it('должен работать с разными projectId', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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

  it('должен обрабатывать сложные userData', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
