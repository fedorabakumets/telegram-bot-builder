/** @fileoverview Проверки группового перехода ботов на настройки проекта. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
import { BOT_INHERITED_SETTING_KEYS } from '@shared/bot-inherited-settings';
import { apiRequest } from '@/queryClient';
import { ProjectBotInheritancePicker } from './ProjectBotInheritancePicker';

vi.mock('@/queryClient', () => ({ apiRequest: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

/**
 * Готовит список с наследующим ботом и двумя индивидуальными режимами.
 * @param projectId - Проект, которому принадлежат боты.
 * @returns Элемент для проверки выбора.
 */
function picker(projectId: number) {
  const tokens = [
    { id: 1, name: 'Джекпот', launchMode: 'polling' },
    { id: 2, name: 'Выдача (@payout)', launchMode: 'webhook' },
    { id: 3, name: 'Наследующий', inheritLaunchMode: true, inheritSleepMode: true,
      inheritAutoRestart: true, inheritMaxRestartAttempts: true, inheritBotSettings: [...BOT_INHERITED_SETTING_KEYS] },
  ] as BotToken[];

  return <ProjectBotInheritancePicker projectId={projectId} tokens={tokens} />;
}

it('сохраняет отметки между поисками и отправляет только выбранных ботов', async () => {
  vi.mocked(apiRequest).mockResolvedValue({ inheritedCount: 2 });
  render(<QueryClientProvider client={new QueryClient()}>{picker(10)}</QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));
  expect(screen.queryByText('Наследующий')).toBeNull();
  const search = screen.getByRole('searchbox');
  fireEvent.change(search, { target: { value: '#1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать найденных' }));
  fireEvent.change(search, { target: { value: '@payout' } });
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать найденных' }));
  fireEvent.click(screen.getByRole('button', { name: 'Использовать настройки проекта (2)' }));

  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/10/bot/launch-inheritance',
    { tokenIds: [1, 2], setting: 'all' }));
  expect(await screen.findByText('Переведено на настройки проекта: 2.')).toBeTruthy();
});

it('сбрасывает выбор при переключении проекта даже при совпадении идентификаторов', () => {
  const client = new QueryClient();
  const { rerender } = render(<QueryClientProvider client={client}>{picker(10)}</QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать всех' }));

  rerender(<QueryClientProvider client={client}>{picker(11)}</QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));

  expect(screen.getByText('Выбрано 0 из 2')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Использовать настройки проекта (0)' })).toHaveProperty('disabled', true);
});

it('выбирает всех ботов с хотя бы одной личной настройкой', async () => {
  /** У каждого кандидата отличается только одно поле. */
  const inherited = { inheritLaunchMode: true, inheritSleepMode: true, inheritAutoRestart: true,
    inheritMaxRestartAttempts: true, inheritBotSettings: [...BOT_INHERITED_SETTING_KEYS] };
  const tokens = [
    { ...inherited, id: 1, name: 'Джекпот', inheritAutoRestart: false },
    { ...inherited, id: 2, name: 'Выдача', inheritLaunchMode: false },
    { ...inherited, id: 3, name: 'Сон', inheritSleepMode: false },
    { ...inherited, id: 4, name: 'Лимит', inheritMaxRestartAttempts: false },
    { ...inherited, id: 5, name: 'Наследующий' },
    { ...inherited, id: 6, name: 'Хранение', inheritBotSettings: BOT_INHERITED_SETTING_KEYS.filter((key) => key !== 'messagesRetentionDays') },
  ] as BotToken[];
  vi.mocked(apiRequest).mockResolvedValue({ inheritedCount: 5 });
  render(<QueryClientProvider client={new QueryClient()}>
    <ProjectBotInheritancePicker projectId={10} tokens={tokens} />
  </QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));
  expect(screen.getAllByText('Свои настройки: 1 из 13')).toHaveLength(5);
  expect(screen.queryByText('Наследующий')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать всех' }));
  fireEvent.click(screen.getByRole('button', { name: 'Использовать настройки проекта (5)' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/10/bot/launch-inheritance',
    { tokenIds: [1, 2, 3, 4, 6], setting: 'all' }));
  expect(await screen.findByText('Переведено на настройки проекта: 5.')).toBeTruthy();
});

it('показывает сообщение сервера и сохраняет выбранных ботов при конфликте настроек', async () => {
  vi.mocked(apiRequest).mockRejectedValue(new Error('Для webhook нужен публичный адрес'));
  render(<QueryClientProvider client={new QueryClient()}>{picker(10)}</QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать всех' }));
  fireEvent.click(screen.getByRole('button', { name: 'Использовать настройки проекта (2)' }));

  expect((await screen.findByRole('alert')).textContent).toBe('Для webhook нужен публичный адрес');
  expect(screen.getByText('Выбрано 2 из 2')).toBeTruthy();
});

it('требует подтверждения при переходе с бессрочного хранения на ограниченное', async () => {
  vi.mocked(apiRequest).mockResolvedValue({ inheritedCount: 1 });
  const tokens = [{ id: 1, name: 'Джекпот', messagesRetentionDays: 0 }] as BotToken[];
  render(<QueryClientProvider client={new QueryClient()}>
    <ProjectBotInheritancePicker projectId={10} tokens={tokens} projectDefaults={{ messagesRetentionDays: 30 }} />
  </QueryClientProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Выбрать ботов для наследования' }));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать всех' }));
  const submit = screen.getByRole('button', { name: 'Использовать настройки проекта (1)' });
  expect(submit).toHaveProperty('disabled', true);
  expect(apiRequest).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('checkbox', { name: /Понимаю, что сообщения старше 30/ }));
  fireEvent.click(submit);
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/10/bot/launch-inheritance',
    { tokenIds: [1], setting: 'all' }));
});
