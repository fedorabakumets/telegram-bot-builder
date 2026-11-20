/** @fileoverview Проверка проектного переключателя базы данных и отката при отказе записи. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BotDatabaseToggle } from './BotDatabaseToggle';
import { apiRequest } from '@/queryClient';

vi.mock('@/queryClient', () => ({ apiRequest: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

afterEach(() => { cleanup(); vi.resetAllMocks(); });

/**
 * Открывает переключатель в проекте с выключенной базой.
 * @param canManage - Признак прав на редактирование проекта.
 * @returns Переключатель.
 */
function renderToggle(canManage: boolean) {
  render(<QueryClientProvider client={new QueryClient()}>
    <BotDatabaseToggle projectId={42} userDatabaseEnabled={0} canManage={canManage} />
  </QueryClientProvider>);
  return screen.getByRole('switch', { name: 'База данных пользователей' });
}

/** Подтверждённое значение остаётся источником после отказа запроса. */
it('сохраняет выбранный проект и возвращает исходное значение при ошибке', async () => {
  let rejectWrite: (error: Error) => void = () => {};
  vi.mocked(apiRequest).mockImplementationOnce(() => new Promise((_, reject) => { rejectWrite = reject; }));
  const toggle = renderToggle(true);
  fireEvent.click(toggle);
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/42', { userDatabaseEnabled: 1 }));
  expect(toggle.getAttribute('aria-checked')).toBe('true');
  expect((toggle as HTMLButtonElement).disabled).toBe(true);
  await act(async () => rejectWrite(new Error('Отказ сервера')));
  await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('false'));
  expect((toggle as HTMLButtonElement).disabled).toBe(false);
});

/** Недоступная настройка не вызывает запрос при попытке переключения. */
it('не отправляет запись без права управления проектом', () => {
  const toggle = renderToggle(false);
  expect((toggle as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(toggle);
  expect(apiRequest).not.toHaveBeenCalled();
});
