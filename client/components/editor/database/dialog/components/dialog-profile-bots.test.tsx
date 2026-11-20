/** @fileoverview Отдельные статусы и читаемые состояния списка ботов общего профиля. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../hooks/use-dialog-profile-bots', () => ({ useDialogProfileBots: mocks.query }));
import { DialogProfileBots } from './dialog-profile-bots';
afterEach(cleanup);
it('показывает отдельные статусы обоих ботов без смешивания с общим состоянием', () => {
  mocks.query.mockReturnValue({ data: { botMemberships: [
    { tokenId: 11, name: 'Первый', username: 'first_bot', status: 'Активен', incomingMessageCount: 2, buttonClickCount: 3 },
    { tokenId: 12, name: 'Второй', status: 'Пользователь заблокировал бота', botAvailability: 'Бот заморожен Telegram', incomingMessageCount: 1, buttonClickCount: 0 },
  ] } });
  render(<DialogProfileBots projectId={12} userId="101" />);
  expect(screen.getByText('@first_bot')).toBeTruthy(); expect(screen.getByText('Второй')).toBeTruthy();
  expect(screen.getByText('Активен')).toBeTruthy(); expect(screen.getByText('Пользователь заблокировал бота')).toBeTruthy();
  expect(screen.getByText('Бот заморожен Telegram')).toBeTruthy();
  expect(mocks.query).toHaveBeenCalledWith(12, '101');
});
it('объясняет отсутствие сохранённых личных переписок', () => {
  mocks.query.mockReturnValue({ data: { botMemberships: [] } });
  render(<DialogProfileBots projectId={12} userId="101" />);
  expect(screen.getByText('Сохранённых личных переписок с ботами нет.')).toBeTruthy();
});
it('показывает ошибку чтения с повтором вместо пустого успешного списка', () => {
  mocks.query.mockReturnValue({ isError: true, refetch: vi.fn() });
  render(<DialogProfileBots projectId={12} userId="101" />);
  expect(screen.getByRole('alert').textContent).toContain('Не удалось загрузить');
  expect(screen.getByRole('button', { name: 'Повторить' })).toBeTruthy();
});
