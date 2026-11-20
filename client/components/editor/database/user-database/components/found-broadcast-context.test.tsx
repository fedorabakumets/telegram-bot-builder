/** @fileoverview Выбор всех результатов, отмена и фиксация списка до редактора рассылки. */
import { act, fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FoundBroadcastProvider } from './found-broadcast-context';
import { FoundBroadcastActions, FoundBroadcastCheckbox, FoundBroadcastToggle } from './found-broadcast-actions';

vi.mock('../content/user-directory-controls', () => ({ useDirectoryControls: () => ({ source: '', status: 'all', premium: 'all', advanced: {} }) }));
vi.mock('@/components/editor/broadcast/wizard/new-broadcast-modal', () => ({
  /** Показывает переданные в редактор ID без Telegram или серверных изменений. */
  NewBroadcastModal: ({ fixedAudience, onClose }: any) => <div role="dialog" aria-label="Тест редактора">
    <output>{JSON.stringify(fixedAudience.userIds)}</output><button onClick={onClose}>Закрыть редактор</button>
  </div>,
}));
/** Список содержит только первую видимую пару пользователей. */
function List({ search = 'скрыто' }: { /** Поиск списка. */ search?: string }) {
  return <FoundBroadcastProvider projectId={13} tokenId={11} search={search} audience="dialogs">
    <FoundBroadcastToggle /><FoundBroadcastActions /><FoundBroadcastCheckbox userId="1" name="Один" /><FoundBroadcastCheckbox userId="2" name="Два" />
  </FoundBroadcastProvider>;
}
beforeEach(() => vi.mocked(fetch).mockReset());
afterEach(cleanup);

it('отмечает всю серверную выборку, включая невидимого третьего человека', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ users: [{ userId: '1' }, { userId: '2' }, { userId: '3' }], total: 3, hasMore: false }) } as Response);
  render(<List />);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать пользователей для рассылки', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать всех' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Рассылка выбранным · 3' })).toBeEnabled());
  expect(screen.getByRole('checkbox', { name: /Один/ })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Рассылка выбранным · 3' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('["1","2","3"]'));
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('отмена снимает галочки, а изменение поиска начинает новый выбор', () => {
  const view = render(<List />);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать пользователей для рассылки', exact: true }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Один/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Отменить выбор' }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать пользователей для рассылки', exact: true }));
  expect(screen.getByRole('checkbox', { name: /Один/ })).not.toBeChecked();
  view.rerender(<List search="другая фраза" />);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

it('отмена прерывает сбор и не открывает редактор после позднего ответа', async () => {
  let finish!: (response: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<List />);
  fireEvent.click(screen.getByRole('button', { name: 'Рассылка по найденным' }));
  fireEvent.click(screen.getByRole('button', { name: 'Отменить', exact: true }));
  await act(async () => finish({ ok: true, json: async () => ({ users: [{ userId: '1' }], total: 1, hasMore: false }) } as Response));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('без поиска и фильтров скрывает рассылку по найденным, сохраняя ручной выбор', () => {
  render(<List search="" />);
  expect(screen.queryByRole('button', { name: 'Рассылка по найденным' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать пользователей для рассылки', exact: true }));
  expect(screen.getByRole('button', { name: 'Рассылка выбранным · 0' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /Один/ }));
  expect(screen.getByRole('button', { name: 'Рассылка выбранным · 1' })).toBeEnabled();
});
