/** @fileoverview Проверки перехода к созданному из шаблона проекту и отказа сервера. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { BotTemplate } from '@shared/schema';
import { useIspolzovatStsenary } from './use-scenariy-mutatsii';

/** Подмены сетевого запроса, навигации и обновления списков. */
const mocks = vi.hoisted(() => ({ request: vi.fn(), invalidate: vi.fn(), navigate: vi.fn(), toast: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request, queryClient: { invalidateQueries: mocks.invalidate } }));
vi.mock('wouter', () => ({ useLocation: () => ['/', mocks.navigate] }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

/**
 * Создаёт окружение настоящей мутации без повторных сетевых запросов.
 * @param props - Дочерний проверяемый хук.
 * @returns Провайдер клиента запросов.
 */
function Wrapper({ children }: { /** Содержимое проверки. */ children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>;
}

beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); });

it('ожидает создание и обновление списка перед открытием возвращённого проекта', async () => {
  let finish!: (value: unknown) => void;
  let refresh!: () => void;
  mocks.request.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  mocks.invalidate.mockImplementation(({ queryKey }) => queryKey[0] === '/api/projects/list'
    ? new Promise<void>(resolve => { refresh = resolve; }) : Promise.resolve());
  localStorage.setItem('selectedTemplate', 'старое значение');
  const { result } = renderHook(() => useIspolzovatStsenary(), { wrapper: Wrapper });
  act(() => result.current.handleUseTemplate({ id: 7 } as BotTemplate));
  expect(mocks.navigate).not.toHaveBeenCalled();
  await waitFor(() => expect(mocks.request).toHaveBeenCalledWith('POST', '/api/templates/7/use'));
  act(() => finish({ project: { id: 123 } }));
  await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['/api/projects/list'] }));
  expect(mocks.navigate).not.toHaveBeenCalled();
  act(() => refresh());
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/editor/123'));
  expect(localStorage.getItem('selectedTemplate')).toBeNull();
});

it('остаётся в каталоге и показывает ошибку, если проект не создан', async () => {
  mocks.request.mockRejectedValue(new Error('Отказ сервера'));
  const { result } = renderHook(() => useIspolzovatStsenary(), { wrapper: Wrapper });
  act(() => result.current.handleUseTemplate({ id: 7 } as BotTemplate));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.invalidate).not.toHaveBeenCalled();
  expect(localStorage.getItem('selectedTemplate')).toBeNull();
});
