/** @fileoverview История и восстановление проверки ботов не отправляют повторный запрос запуска. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersTelegramBotCheckButton } from './users-telegram-bot-check-button';
const mocks = vi.hoisted(() => ({ stream: vi.fn(), run: null as unknown }));
vi.mock('./stream-telegram-bot-check', () => ({ streamTelegramBotCheck: mocks.stream }));
vi.mock('./use-telegram-bot-check-run', () => ({ useTelegramBotCheckRun: () => ({ data: { run: mocks.run } }) }));
vi.mock('@/hooks/use-project-tokens', () => ({ useProjectTokens: () => [{ tokens: [{ id: 9, name: 'Бот' }] }] }));
vi.mock('../components/check-history/check-history-content', () => ({
  CheckHistoryContent: ({ enabled }: { /** Открыто ли окно. */ enabled: boolean }) => enabled ? <section>Сохранённые проверки ботов</section> : null,
}));
/** Расписание тестируется отдельно от ручного запуска. */
vi.mock('@/components/editor/database/user-database/components/check-history/check-schedule-settings', () => ({ CheckScheduleSettings: () => null }));

afterEach(() => { cleanup(); mocks.stream.mockReset(); mocks.run = null; });
/** Создаёт изолированный кэш без повторных запросов. @returns Клиент запросов. */
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
/** История доступна сразу после открытия страницы без локального результата проверки. */
it('открывает прошлые проверки без запуска Telegram', () => {
  render(<QueryClientProvider client={client()}><UsersTelegramBotCheckButton projectId={12} tokenId={9} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить бота в Telegram' }));
  expect(screen.getByText('Сохранённые проверки ботов')).toBeInTheDocument();
  expect(mocks.stream).not.toHaveBeenCalled();
});
/** Уже работающая серверная проверка восстанавливается без повторного POST. */
it('показывает восстановленный прогресс и переход в историю', () => {
  mocks.run = { id: 4, status: 'running', startedAt: '2026-11-17T09:00:00Z', finishedAt: null, failureReason: null, total: 1,
    result: { items: [], available: 0, unavailable: 0, errors: 0 } };
  render(<QueryClientProvider client={client()}><UsersTelegramBotCheckButton projectId={12} tokenId={9} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Проверяем ботов…' }));
  expect(screen.getByRole('button', { name: 'Проверка выполняется…' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Проверено 0 из 1');
  expect(screen.getByText('Сохранённые проверки ботов')).toBeInTheDocument();
  expect(mocks.stream).not.toHaveBeenCalled();
});

/** Главная кнопка только открывает окно; новый запуск требует отдельного подтверждения. */
it('запускает проверку только кнопкой внутри окна', async () => {
  mocks.stream.mockReturnValue(new Promise(() => {}));
  render(<QueryClientProvider client={client()}><UsersTelegramBotCheckButton projectId={12} tokenId={9} /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить бота в Telegram' }));
  expect(mocks.stream).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Начать проверку' }));
  await waitFor(() => expect(mocks.stream).toHaveBeenCalledOnce());
});
