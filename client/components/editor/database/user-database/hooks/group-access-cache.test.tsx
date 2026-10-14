/** @fileoverview Проверки общего состояния списка и шапки и ручного восстановления доступа. */
import { createElement, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { groupAccessKey } from './group-access-cache';
import { useSyncGroups } from './use-sync-groups';
import { DialogHeaderIdentity } from '../dialogs-tab/dialog-header-identity';
import { DialogListItem } from '../dialogs-tab/dialog-list-item';
import type { UserBotData } from '@shared/schema';

vi.mock('../../dialog/components/user-avatar', () => ({ UserAvatar: () => null }));
/** Сохранённый диалог из серверного списка. */
const group = { userId: '-1001', firstName: 'Сохранённое название', isGroup: true,
  chatType: 'supergroup', accessStatus: 'kicked' } as unknown as UserBotData;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/**
 * Подключает синхронизацию к тестовому списку.
 * @returns Тестовый компонент
 */
function Sync() { useSyncGroups(12, 9, [group]); return null; }

it('сохранённая метка не вызывает запрос и имя обновляется одновременно в двух местах', async () => {
  const client = new QueryClient();
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    group: { name: 'Новое название', avatarUrl: null }, accessStatus: 'available',
  }) });
  vi.stubGlobal('fetch', fetchMock);
  /**
   * Соединяет карточку и шапку общим кэшем.
   * @param props - Тестовое содержимое
   * @returns Провайдер запросов
   */
  function Wrapper({ children }: {
    /** Тестовые компоненты. */
    children: ReactNode;
  }) { return createElement(QueryClientProvider, { client }, children); }
  render(<><Sync /><DialogListItem user={group} projectId={12} tokenId={9}
    isSelected onClick={vi.fn()} /><DialogHeaderIdentity user={group} projectId={12} tokenId={9} /></>, { wrapper: Wrapper });
  await waitFor(() => expect(screen.getAllByText('Бот исключён')).toHaveLength(2));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getAllByRole('button', { name: 'Проверить доступ' })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить доступ' }));
  await waitFor(() => expect(screen.getAllByText('Новое название')).toHaveLength(2));
  expect(screen.queryByText('Бот исключён')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => { client.setQueryData(groupAccessKey(12, 10, '-1001'), { status: 'kicked', name: 'Чужое название' }); });
  expect(screen.queryByText('Чужое название')).not.toBeInTheDocument();
});

it('показывает блокировку пользователя в карточке и шапке', async () => {
  const client = new QueryClient();
  const user = { userId: '12345', firstName: '12345', userName: 'Spy43210',
    accessStatus: 'kicked' } as unknown as UserBotData;
  /** Подключает сохранённый личный статус к общему кэшу. */
  function PrivateSync() { useSyncGroups(9, 5, [user]); return null; }
  /**
   * Предоставляет тестовым компонентам общий клиент запросов.
   * @param props - Дочерние компоненты
   * @returns Провайдер кэша
   */
  function Wrapper({ children }: { /** Содержимое. */ children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  }
  render(<><PrivateSync /><DialogListItem user={user} projectId={9} tokenId={5}
    isSelected onClick={vi.fn()} /><DialogHeaderIdentity user={user} projectId={9} tokenId={5} /></>, { wrapper: Wrapper });
  await waitFor(() => expect(screen.getAllByText('Пользователь заблокировал бота')).toHaveLength(2));
  expect(screen.getAllByRole('button', { name: 'Проверить доступ' })).toHaveLength(1);
});
