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

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSendMessage } from '../../../hooks/use-send-message';
import { useToast } from '@/hooks/use-toast';
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

describe('useSendMessage', () => {
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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
  });

  it('должен вызывать onSent при успешной отправке', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

    const onSent = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123, onSent), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('должен обрабатывать ошибку отправки', async () => {
    mockApiRequest.mockRejectedValue(new Error('Failed to send'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSendMessage(1, 123), { wrapper });

    await act(async () => {
      result.current.mutate({ messageText: 'Тестовое сообщение' });
    });

    expect(result.current.isError).toBe(true);
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

  it('должен работать с разными projectId', async () => {
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
    mockApiRequest.mockResolvedValue({ ok: true } as any);

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
});
