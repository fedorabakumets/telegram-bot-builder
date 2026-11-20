/** @fileoverview Проверки владельца, прав интерфейса и ошибок управления доступом. */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProjectCollaborators } from './ProjectCollaborators';

const mocks = vi.hoisted(() => ({ request: vi.fn(), toast: vi.fn(), fetch: vi.fn() }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/editor/header/hooks/use-telegram-auth', () => ({
  useTelegramAuth: () => ({ user: { id: 21 }, isTelegramUser: () => true }),
}));

/** Список профилей владельца и приглашённого участника. */
const members = [{ userId: 12, name: 'Анна' }, { userId: 21, name: 'Игорь' }];

/**
 * Открывает общий список участников с отключёнными автоматическими повторами запросов.
 * @param canManage - Возможность изменять доступ.
 * @returns Обёртка тестового интерфейса.
 */
function openCollaborators(canManage: boolean) {
  vi.stubGlobal('fetch', mocks.fetch);
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={query}>
      <ProjectCollaborators projectId={10} ownerId={12} canManage={canManage} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it('показывает владельца без снятия доступа и сохраняет ID после отказа в добавлении', async () => {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => members });
  mocks.request.mockRejectedValue(Object.assign(new Error('403'), { error: 'Нет доступа к этому проекту' }));
  openCollaborators(true);
  expect(await screen.findByText('Владелец')).toBeTruthy();
  expect(screen.getByText('Участник')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Закрыть доступ участнику 12' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Закрыть доступ участнику 21' })).toBeTruthy();

  const input = screen.getByRole('textbox', { name: 'Telegram ID нового участника' });
  const add = screen.getByRole('button', { name: 'Добавить участника' });
  fireEvent.change(input, { target: { value: '24abc' } });
  expect(add).toHaveProperty('disabled', true);
  fireEvent.change(input, { target: { value: '12' } });
  expect(add).toHaveProperty('disabled', true);
  expect(mocks.request).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '24' } });
  fireEvent.click(add);
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
    description: 'Нет доступа к этому проекту', variant: 'destructive',
  })));
  expect(mocks.request).toHaveBeenCalledWith('POST', '/api/bot/projects/10/collaborators', { user_id: 24 });
  expect(input).toHaveProperty('value', '24');
});

it('отличает ошибку загрузки от пустого списка и позволяет повторить чтение', async () => {
  mocks.fetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => members });
  openCollaborators(false);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('Нет участников')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByText('Анна')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Закрыть доступ участнику 21' })).toBeNull();
  expect(screen.queryByRole('textbox', { name: 'Telegram ID нового участника' })).toBeNull();
});
