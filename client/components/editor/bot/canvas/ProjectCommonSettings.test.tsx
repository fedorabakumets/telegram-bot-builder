/** @fileoverview Проверяет управление базой, администраторами и доступом через проектные запросы с заглушками. */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { BotProject } from '@shared/schema';
import { apiRequest } from '@/queryClient';
import { ProjectCommonSettings } from './ProjectCommonSettings';

const mocks = vi.hoisted(() => ({ user: null as { id: number } | null, toast: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ toast: mocks.toast, useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/editor/header/hooks/use-telegram-auth', () => ({
  useTelegramAuth: () => ({ user: mocks.user, isTelegramUser: () => !!mocks.user }),
}));

/** Проект с выключенной базой и известным владельцем. */
const project = { id: 10, ownerId: 111, userDatabaseEnabled: 0 } as BotProject;

/**
 * Открывает общие настройки с независимым кэшем.
 * @returns Кэш запросов, использованный формой.
 */
function openSettings() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['/api/projects/10'], project);
  render(<QueryClientProvider client={client}><ProjectCommonSettings project={project} /></QueryClientProvider>);
  return client;
}

beforeEach(() => {
  mocks.user = { id: 111 };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [
    { userId: 111, name: 'Павел' }, { userId: 222, name: 'Ирина' },
  ] })));
  vi.mocked(apiRequest).mockImplementation(async (method, url) => {
    if (url === '/api/projects/10/admin-ids') return { adminIds: method === 'GET' ? '333' : '444' };
    if (url === '/api/projects/10') return { ...project, userDatabaseEnabled: 1 };
    return {};
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('сохраняет общую настройку базы и список администраторов по отдельным маршрутам проекта', async () => {
  const client = openSettings();
  const admin = await screen.findByRole('textbox', { name: 'Telegram ID администратора 1' });
  expect(admin).toHaveProperty('value', '333');
  fireEvent.change(admin, { target: { value: '444' } });
  expect(apiRequest).not.toHaveBeenCalledWith('PUT', '/api/projects/10/admin-ids', expect.anything());
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить список администраторов' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/10/admin-ids', { adminIds: '444' }));
  expect(await screen.findByText('Список сохранён.')).toBeTruthy();

  fireEvent.click(screen.getByRole('switch', { name: 'База данных пользователей' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('PUT', '/api/projects/10', { userDatabaseEnabled: 1 }));
  await waitFor(() => expect(client.getQueryData(['/api/projects/10'])).toMatchObject({ userDatabaseEnabled: 1, ownerId: 111 }));
});

it('различает администраторов ботов и участников проекта, сохраняет доступ через отдельный маршрут', async () => {
  openSettings();
  expect(await screen.findByText('Ирина')).toBeTruthy();
  expect(screen.getByText('Владелец')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Закрыть доступ участнику 111' })).toBeNull();

  fireEvent.change(screen.getByRole('textbox', { name: 'Telegram ID нового участника' }), { target: { value: '555' } });
  fireEvent.click(screen.getByRole('button', { name: 'Добавить участника' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('POST', '/api/bot/projects/10/collaborators', { user_id: 555 }));

  fireEvent.click(screen.getByRole('button', { name: 'Закрыть доступ участнику 222' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/bot/projects/10/collaborators/222'));
  expect(apiRequest).not.toHaveBeenCalledWith('PUT', '/api/projects/10/admin-ids', expect.anything());
});

it('показывает данные гостю без возможности менять их', async () => {
  mocks.user = null;
  openSettings();
  expect(await screen.findByText('333')).toBeTruthy();
  expect(await screen.findByText('Ирина')).toBeTruthy();
  expect(screen.getByRole('switch', { name: 'База данных пользователей' })).toHaveProperty('disabled', true);
  expect(screen.queryByRole('button', { name: 'Сохранить список администраторов' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Добавить участника' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Закрыть доступ участнику 222' })).toBeNull();
});

it('не меняет кэш проекта, если сервер отклонил изменение настройки базы', async () => {
  vi.mocked(apiRequest).mockImplementation(async (method, url) => {
    if (method === 'PUT' && url === '/api/projects/10') throw new Error('Доступ запрещён');
    return { adminIds: '' };
  });
  const client = openSettings();
  const toggle = screen.getByRole('switch', { name: 'База данных пользователей' });
  fireEvent.click(toggle);

  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Доступ запрещён' })));
  await waitFor(() => expect(toggle.getAttribute('aria-checked')).toBe('false'));
  expect(client.getQueryData(['/api/projects/10'])).toMatchObject({ userDatabaseEnabled: 0 });
});
