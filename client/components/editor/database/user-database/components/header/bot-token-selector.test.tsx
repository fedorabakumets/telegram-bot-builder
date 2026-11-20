/** @fileoverview Проверка уникального количества людей у пункта «Все боты» вместо суммы по ботам. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
import { projectBotStatusesQueryKey } from '@/components/editor/bot/project-bot-statuses-query';
vi.mock('./use-token-user-counts', async importOriginal => ({
  ...await importOriginal<typeof import('./use-token-user-counts')>(),
  useTokenUserCounts: () => new Map([[1, 30], [2, 20]]),
}));
import { BotTokenSelector } from './bot-token-selector';
afterEach(cleanup);
/** Терминал показывает текущий запуск даже при активном токене остановленного бота. */
it('отличает активный токен от работающего процесса в терминале', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const key = projectBotStatusesQueryKey(12);
  client.setQueryData(key, { statuses: [{ status: 'stopped', tokenId: 1, instance: null }] });
  const tokens = [{ id: 1, name: 'Бот', isActive: 1 }] as BotToken[];
  render(<QueryClientProvider client={client}><BotTokenSelector projectId={12} tokens={tokens}
    selectedTokenId={1} allowAll={false} showRuntimeStatus onSelect={() => {}} /></QueryClientProvider>);
  expect(screen.getByRole('combobox').textContent).toContain('Офлайн');
  act(() => client.setQueryData(key, { statuses: [{ status: 'running', tokenId: 1, instance: null }] }));
  await waitFor(() => expect(screen.getByRole('combobox').textContent).toContain('Онлайн'));
  client.clear();
});
/** Итог сервера может быть меньше суммы по ботам; подтверждённый ноль остаётся видимым. */
it('показывает уникальный итог проекта и обновляет его до нуля', async () => {
  const client = new QueryClient();
  const key = ['/api/projects/12/users/stats?privateContactsOnly=true', null];
  client.setQueryData(key, { totalUsers: 42 });
  const tokens = [{ id: 1, name: 'Первый' }, { id: 2, name: 'Второй' }] as BotToken[];
  render(<QueryClientProvider client={client}><BotTokenSelector projectId={12} tokens={tokens} selectedTokenId={null} onSelect={() => {}} /></QueryClientProvider>);
  expect(screen.getByRole('combobox', { name: 'Бот пользователей' }).textContent).toContain('42');
  expect(screen.getByRole('combobox', { name: 'Бот пользователей' }).textContent).not.toContain('50');
  act(() => client.setQueryData(key, { totalUsers: 0 }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Бот пользователей' }).textContent).toContain('0'));
  client.clear();
});
/** Первый список не показывает пустые числа и произвольный порядок до получения полного пакета. */
it('открывает ботов только с готовыми числами по убыванию', async () => {
  /** Эмулятор DOM не реализует прокрутку, используемую раскрытым списком Radix. */
  Element.prototype.scrollIntoView = vi.fn();
  const client = new QueryClient();
  const tokens = [{ id: 1, name: 'Маленький' }, { id: 2, name: 'Большой' }] as BotToken[];
  const view = (counts: Map<number, number>) => <QueryClientProvider client={client}><BotTokenSelector
    projectId={12} tokens={tokens} selectedTokenId={1} allowAll={false} audienceCounts={counts} onSelect={() => {}} /></QueryClientProvider>;
  const { rerender } = render(view(new Map()));
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
  await screen.findByText('Загрузка количества пользователей…');
  expect(screen.queryAllByRole('option')).toHaveLength(0);
  rerender(view(new Map([[1, 0], [2, 10]])));
  const options = await screen.findAllByRole('option');
  expect(options.map(option => option.textContent)).toEqual([expect.stringContaining('Большой'), expect.stringContaining('Маленький')]);
  expect(options[1].textContent).toContain('0');
  client.clear();
});
