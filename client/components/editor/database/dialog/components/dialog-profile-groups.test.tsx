/** @fileoverview Проверки источников групп общего профиля и состояний загрузки данных. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DialogProfileGroups } from './dialog-profile-groups';

/** Показывает секцию в изолированном кэше без повторов запросов. */
function showGroups() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><DialogProfileGroups projectId={12} userId="123" /></QueryClientProvider>);
}
beforeEach(() => vi.mocked(fetch).mockReset());
afterEach(cleanup);

it('различает сохранённое членство и сообщения по разным ботам', async () => {
  const base = { groupId: '-1001', name: 'Чат', chatType: 'supergroup', botName: 'Бот', membershipStatus: null,
    membershipCheckedAt: null, lastActivityAt: null, messageCount: 0 };
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ groups: [
    { ...base, tokenId: 9, botUsername: 'first_bot', membershipKnown: true, membershipStatus: 'left' },
    { ...base, tokenId: 10, botUsername: 'second_bot', membershipKnown: false, messageCount: 3 },
  ] }) } as Response);
  showGroups();
  expect(await screen.findByText('Сохранённый статус: вышел')).toBeInTheDocument();
  expect(screen.getByText('Найден в истории сообщений')).toBeInTheDocument();
  expect(screen.getByText('@first_bot · #9')).toBeInTheDocument();
  expect(screen.getByText('@second_bot · #10')).toBeInTheDocument();
  expect(screen.getByText('Сохранённых сообщений: 3')).toBeInTheDocument();
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe('/api/projects/12/users/123/groups');
});

it('показывает отсутствие сведений отдельно от ошибки', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ groups: [] }) } as Response);
  const view = showGroups();
  expect(await screen.findByText('Сохранённых сведений о группах нет.')).toBeInTheDocument();
  view.unmount();
  vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  showGroups();
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить группы.'));
  expect(screen.getByRole('button', { name: 'Повторить' })).toBeEnabled();
});
