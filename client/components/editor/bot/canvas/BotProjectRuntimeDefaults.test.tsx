/** @fileoverview Проверки независимого сохранения общих настроек запуска ботов. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BotProjectRuntimeDefaults } from './BotProjectRuntimeDefaults';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: request }));

/** Исходная прокрутка для восстановления после проверки списка в jsdom. */
const scrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');

afterEach(() => {
  cleanup();
  request.mockReset();
  if (scrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

it('сохраняет только изменённый лимит попыток независимо от автоперезапуска', async () => {
  /** jsdom не реализует прокрутку к выбранному варианту. */
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  const saved = { sleepMode: 'process', autoRestart: 0, maxRestartAttempts: 3 };
  request.mockResolvedValueOnce(saved).mockResolvedValueOnce({ ...saved, maxRestartAttempts: 5 });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BotProjectRuntimeDefaults projectId={10} />
    </QueryClientProvider>,
  );
  const attempts = await screen.findByRole('combobox', { name: 'Максимум попыток перезапуска' });
  /** Открываем общий список с клавиатуры и выбираем лимит. */
  fireEvent.keyDown(attempts, { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: 'Максимум попыток: 5' }));
  expect(request).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить настройки запуска' }));
  await waitFor(() => {
    expect(request).toHaveBeenCalledWith('PUT', '/api/projects/10/bot/runtime-defaults', { maxRestartAttempts: 5 });
  });
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Сохранить настройки запуска' })).toHaveProperty('disabled', true);
  });
});
