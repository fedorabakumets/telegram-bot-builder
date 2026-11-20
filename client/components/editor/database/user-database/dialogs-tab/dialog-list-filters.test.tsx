/** @fileoverview Проверки общих фильтров диалогов, автоприменения, сброса и изоляции состояния. */
import { useEffect } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DialogListFilters } from './dialog-list-filters';
import { UserDirectoryControls, useDirectoryControls } from '../content/user-directory-controls';
/** Тестовая область переписки, не содержащая реальных персональных данных. */
type Kind = 'all' | 'users' | 'groups' | 'channels';
/** Показывает фактически применённые ограничения реального провайдера. */
function State({ id }: { /** Область наблюдения. */ id: string }) {
  const controls = useDirectoryControls();
  return <output data-testid={id}>{JSON.stringify({ source: controls?.source, status: controls?.status,
    premium: controls?.premium, advanced: controls?.advanced })}</output>;
}
/** Заполняет серверные количества для подписей существующих общих селекторов. */
function Facets() {
  const setResult = useDirectoryControls()!.setResult;
  useEffect(() => setResult({ total: 6, sourceCounts: { Реклама: 4, Редкий: 2 },
    statusCounts: { all: 6, active: 3, inactive: 0, blocked: 2, deleted: 1, botUnavailable: 0, unverified: 0 },
    premiumCounts: { all: 6, true: 2, false: 4 }, languageCounts: { ru: 3, en: 2, __unknown__: 1 } }), [setResult]);
  return null;
}
/** Сохраняет один клиент и отдельные провайдеры диалогов и пользователей между вкладками. */
function Fixture({ client, kind = 'all' }: { /** Изолированный кэш теста. */ client: QueryClient; /** Вид переписки. */ kind?: Kind }) {
  return <QueryClientProvider client={client}><UserDirectoryControls audience="dialogs"><Facets />
    <DialogListFilters projectId={12} tokenId={9} search="Анна" dialogKind={kind} /><State id="dialogs-state" />
  </UserDirectoryControls><UserDirectoryControls><State id="users-state" /></UserDirectoryControls></QueryClientProvider>;
}
/** Читает текущее состояние фильтров, не подменяя обработчики компонентов. */
function state(id = 'dialogs-state') { return JSON.parse(screen.getByTestId(id).textContent!); }
/** Раскрывает общую кнопку, не меняя уже открытое состояние панели. */
function openFilters() {
  if (!screen.queryByRole('combobox', { name: 'Источник пользователей' }))
    fireEvent.click(screen.getByRole('button', { name: 'Фильтры диалогов', exact: true }));
}
/** Выбирает значение настоящего селектора Radix клавиатурным раскрытием. */
async function choose(label: string, option: RegExp) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: option }));
}
beforeEach(() => {
  /** JSDOM не реализует прокрутку, которую использует раскрытый селектор. */
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ sources: ['Реклама', 'Редкий'], variables: [], total: 6 }) } as Response);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
/** Источник, статус, Premium и язык применяются сразу и не затрагивают вкладку пользователей. */
it('автоматически применяет общие фильтры и сбрасывает их одной кнопкой', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<Fixture client={client} />);
  expect(screen.queryByRole('combobox', { name: 'Источник пользователей' })).toBeNull();
  expect(screen.queryByRole('combobox', { name: 'Статус пользователя' })).toBeNull();
  openFilters();
  await choose('Источник пользователей', /Реклама/);
  await choose('Статус пользователя', /Аккаунт удалён/);
  await choose('Telegram Premium', /С Telegram Premium/);
  await choose('Язык Telegram', /Русский/);
  expect(state()).toEqual({ source: 'Реклама', status: 'deleted', premium: 'true', advanced: { language: 'ru' } });
  expect(screen.getByText('Фильтры применяются к личным диалогам')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Применить' })).toBeNull();
  expect(state('users-state')).toEqual({ source: '', status: 'all', premium: 'all', advanced: {} });
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Язык Telegram' }), { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('combobox', { name: 'Источник пользователей' })).toBeNull());
  expect(state()).toEqual({ source: 'Реклама', status: 'deleted', premium: 'true', advanced: { language: 'ru' } });
  openFilters();
  expect(screen.getByRole('combobox', { name: 'Статус пользователя' }).textContent).toContain('Аккаунт удалён');
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры', exact: true }));
  expect(state()).toEqual({ source: '', status: 'all', premium: 'all', advanced: {} });
  expect(screen.queryByText('Фильтры применяются к личным диалогам')).toBeNull();
  client.clear();
}, 15000);
/** Группы и каналы не показывают фильтры профиля, но переключение не теряет выбранные условия. */
it('скрывает фильтры групп и каналов, сохраняя условия личных диалогов', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<Fixture client={client} kind="users" />);
  openFilters();
  await choose('Статус пользователя', /Пользователь заблокировал бота/);
  for (const kind of ['groups', 'channels'] as const) {
    view.rerender(<Fixture client={client} kind={kind} />);
    expect(screen.queryByRole('button', { name: 'Фильтры диалогов', exact: true })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Статус пользователя' })).toBeNull();
    expect(state().status).toBe('blocked');
  }
  view.rerender(<Fixture client={client} kind="all" />);
  openFilters();
  expect(screen.getByRole('combobox', { name: 'Статус пользователя' }).textContent).toContain('Пользователь заблокировал бота');
  expect(screen.getByText('Фильтры применяются к личным диалогам')).toBeTruthy();
  client.clear();
});
/** Дополнительные диапазоны применяются без кнопки подтверждения и не возвращаются после общего сброса. */
it('применяет дополнительный диапазон и не восстанавливает его после сброса', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<Fixture client={client} />);
  openFilters();
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  fireEvent.click(screen.getByRole('button', { name: 'Входящие сообщения' }));
  fireEvent.change(screen.getByLabelText('Входящие сообщения: до'), { target: { value: '0' } });
  fireEvent.keyDown(screen.getByLabelText('Входящие сообщения: до'), { key: 'Escape' });
  await waitFor(() => expect(state().advanced).toEqual({ messagesMax: '0' }));
  expect(screen.queryByRole('button', { name: 'Применить' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры', exact: true }));
  await new Promise(resolve => setTimeout(resolve, 400));
  expect(state().advanced).toEqual({});
  client.clear();
});
