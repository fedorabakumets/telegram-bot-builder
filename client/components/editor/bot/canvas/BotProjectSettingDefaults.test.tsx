/** @fileoverview Проверка предупреждения при сокращении проектного срока хранения. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { BotProjectSettingDefaults } from './BotProjectSettingDefaults';
import type { BotRuntimeSelect } from '../card/BotRuntimeSelect';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: request }));
vi.mock('../card/BotRuntimeSelect', () => ({
  /** Подменяет оформление списка, сохраняя ввод и варианты. */
  BotRuntimeSelect: ({ label, value, options, onChange }: ComponentProps<typeof BotRuntimeSelect>) => (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', vi.fn(function () {
    return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  }));
});

afterEach(() => {
  cleanup();
  request.mockReset();
  vi.unstubAllGlobals();
});

it('предупреждает об очистке и сохраняет только изменённый срок', async () => {
  const saved = {
    saveIncomingMedia: 0, messagesRetentionDays: 0, contentCache: 0,
    logLevel: 'WARNING', catchAllHandlers: 1, trackUserBlocks: 1,
    trackGroupMembership: 1, protectContent: 0, webhookBaseUrl: null,
  };
  request.mockResolvedValueOnce(saved).mockResolvedValueOnce({ ...saved, messagesRetentionDays: 30 });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BotProjectSettingDefaults projectId={10} />
    </QueryClientProvider>,
  );
  const retention = await screen.findByRole('combobox', { name: 'Хранить сообщения' });
  expect(screen.queryByRole('checkbox')).toBeNull();
  fireEvent.change(retention, { target: { value: '30' } });
  const button = screen.getByRole('button', { name: 'Сохранить настройки' });
  expect(button).toHaveProperty('disabled', true);
  expect(request).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('checkbox', { name: /могут быть удалены сообщения старше 30/ }));
  fireEvent.click(button);
  await waitFor(() => {
    expect(request).toHaveBeenCalledWith('PUT', '/api/projects/10/bot/setting-defaults', { messagesRetentionDays: 30 });
  });
  await waitFor(() => expect(screen.queryByRole('checkbox')).toBeNull());
});
