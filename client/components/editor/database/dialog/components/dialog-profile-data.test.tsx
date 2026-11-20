/** @fileoverview Проверка состава общей карточки и независимости её секций от выбранного бота. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogProfileData } from './dialog-profile-data';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { firstName: 'Обновлённое имя', userName: 'updated' }, isLoading: false, isError: false }),
  useMutation: () => ({ isPending: false, isError: false, isSuccess: false }),
}));
vi.mock('../hooks/use-dialog-profile-bots', () => ({ useDialogProfileBots: () => ({
  data: { registeredAt: '2026-01-01T10:00:00Z', lastInteraction: '2026-11-18T10:00:00Z' },
}) }));
vi.mock('./dialog-profile', () => ({
  /** Показывает итоговые реквизиты и слоты без загрузки фотографии. */
  DialogProfile: ({ user, children, actions }: { /** Итоговые даты. */ user: { registeredAt?: string; lastInteraction?: string }; /** Секции. */ children: React.ReactNode; /** Действия. */ actions: React.ReactNode }) =>
    <div><span>{user.registeredAt}</span><span>{user.lastInteraction}</span>{actions}{children}</div>,
}));
vi.mock('./dialog-profile-bots', () => ({ DialogProfileBots: () => <p>Все боты пользователя</p> }));
vi.mock('./dialog-profile-groups', () => ({ DialogProfileGroups: () => <p>Все группы пользователя</p> }));
vi.mock('./dialog-shared-media', () => ({
  /** Позволяет проверить общую область личных медиа. */
  DialogSharedMedia: ({ tokenId }: { /** Ограничение бота. */ tokenId?: number | null }) => <p>Медиа: {tokenId ?? 'все боты'}</p>,
}));

afterEach(cleanup);

describe('Общий профиль пользователя', () => {
  it('собирает все секции, общие даты и передаёт обновлённые сведения в слоты', () => {
    render(<DialogProfileData user={{ userId: '123', firstName: 'Старое имя', registeredAt: '2026-10-01' }} projectId={12} tokenId={9} onClose={vi.fn()}
      actions={({ user, tokenId }) => <button>{user.firstName} · бот {tokenId}</button>}>
      {({ user }) => <p>Ответы @{user.userName}</p>}
    </DialogProfileData>);
    expect(screen.getByText('2026-01-01T10:00:00Z')).toBeTruthy();
    expect(screen.getByText('2026-11-18T10:00:00Z')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Обновлённое имя · бот 9' })).toBeTruthy();
    expect(screen.getByText('Ответы @updated')).toBeTruthy();
    expect(screen.getByText('Все боты пользователя')).toBeTruthy();
    expect(screen.getByText('Все группы пользователя')).toBeTruthy();
    expect(screen.getByText('Медиа: все боты')).toBeTruthy();
  });
});
