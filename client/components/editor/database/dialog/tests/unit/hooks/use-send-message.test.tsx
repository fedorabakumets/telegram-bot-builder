/**
 * @fileoverview Тесты для хука useSendMessage
 * Проверяет отправку сообщений и обработку результатов
 * @module tests/unit/hooks/use-send-message.test
 */

/// <reference types="vitest/globals" />

// Моки должны быть до импортов
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/queryClient', () => ({
  apiRequest: vi.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendMessage } from '../../../hooks/use-send-message';
import { apiRequest } from '@/queryClient';

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

describe('useSendMessage', () => {
  it('должен возвращать мутацию с правильными методами', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('должен успешно отправлять сообщение', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: 'Тестовое сообщение', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });

  it('должен вызывать onSent при успешной отправке', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const onSent = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, onSent, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
    });

    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('должен обрабатывать ошибку отправки', async () => {
    mockApiRequest.mockRejectedValue(new Error('Failed to send'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    // Используем mutateAsync и ловим ошибку
    await act(async () => {
      try {
        await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
      } catch (error) {
        // Ошибка ожидаема
      }
    });

    // Ждём обновления состояния мутации
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('должен выбрасывать ошибку если userId не указан', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: undefined, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
      } catch (error) {
        expect((error as Error).message).toBe('No user selected');
      }
    });
  });

  it('должен работать с разными projectId', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 999, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/999/users/123/send-message',
      { messageText: 'Тестовое сообщение', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });

  it('должен работать с разными userId', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 456, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: 'Тестовое сообщение' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/456/send-message',
      { messageText: 'Тестовое сообщение', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });

  it('должен отправлять текст сообщения', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: 'Привет, мир!' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: 'Привет, мир!', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });

  it('должен обрабатывать пустой текст сообщения', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: '' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: '', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });

  it('должен обрабатывать HTML в сообщении', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage({ projectId: 1, userId: 123, addOptimisticMessage: vi.fn(), removeOptimisticMessage: vi.fn() }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ messageText: '<b>Жирный</b> текст' });
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/users/123/send-message',
      { messageText: '<b>Жирный</b> текст', mediaUrls: [], buttons: [], buttonsPerRow: 0 }
    );
  });
});
