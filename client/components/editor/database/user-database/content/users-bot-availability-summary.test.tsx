/** @fileoverview Проверка количества ботов отдельно от пользователей и локально отключённых токенов. */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { UsersBotAvailabilitySummary } from './users-bot-availability-summary';
afterEach(cleanup);
describe('Счётчики ботов проекта', () => {
  /** Проверяет область выбранного бота без чужих счётчиков проекта. */
  it('показывает статус только выбранного бота и реагирует на смену выбора', () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    client.setQueryData(['/api/projects/12/tokens'], [{ id: 1, authorizationError: null },
      { id: 2, authorizationError: 'bot_blocked' }]);
    const view = render(<QueryClientProvider client={client}><UsersBotAvailabilitySummary projectId={12} tokenId={1} /></QueryClientProvider>);
    expect(screen.queryByText('Ботов в проекте')).toBeNull();
    expect(screen.getByText('Активен')).toBeTruthy();
    view.rerender(<QueryClientProvider client={client}><UsersBotAvailabilitySummary projectId={12} tokenId={2} /></QueryClientProvider>);
    expect(screen.getByText('Бот заблокирован Telegram')).toBeTruthy();
    client.clear();
  });
  it('считает токены и подтверждённые ошибки, затем обновляется из общего кэша', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    const key = ['/api/projects/12/tokens'];
    const tokens = [{ id: 1, isActive: 1, authorizationError: null }, { id: 2, isActive: 0, authorizationError: 'unauthorized' },
      { id: 3, isActive: 0, authorizationError: 'bot_blocked' }, { id: 4, isActive: 0, authorizationError: null }];
    client.setQueryData(key, tokens);
    render(<QueryClientProvider client={client}><UsersBotAvailabilitySummary projectId={12} /></QueryClientProvider>);
    expect(screen.getByText('Ботов в проекте').nextElementSibling?.textContent).toBe('4');
    expect(screen.getByText('Недоступны в Telegram').nextElementSibling?.textContent).toBe('2');
    act(() => client.setQueryData(key, tokens.map(token => ({ ...token, authorizationError: null }))));
    await waitFor(() => expect(screen.getByText('Недоступны в Telegram').nextElementSibling?.textContent).toBe('0'));
    client.clear();
  });
});
