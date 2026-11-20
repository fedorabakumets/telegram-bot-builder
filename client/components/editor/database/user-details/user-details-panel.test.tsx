/** @fileoverview Проверка подключения общей карточки и сохранения действий вкладки пользователей. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { UserBotData } from '@shared/schema';
import { UserDetailsPanel } from './user-details-panel';

vi.mock('./hooks/useUserList', () => ({ useUserList: () => ({ users: [] }) }));
vi.mock('./components/UserSelect', () => ({ UserSelect: () => null }));
vi.mock('./components/user-profile-extras', () => ({
  /** Показывает контекст, переданный дополнительным разделам профиля. */
  UserProfileExtras: ({ tokenId, user }: {
    /** Бот текущей карточки. */ tokenId: number;
    /** Данные открытого пользователя. */ user: UserBotData;
  }) =>
    <div data-testid="profile-extras">{tokenId}:{user.firstName}:{JSON.stringify(user.userData)}</div>,
}));
vi.mock('../dialog/components/dialog-profile-data', () => ({
  /** Имитирует общий профиль, обновивший реквизиты и выбравший конкретного бота. */
  DialogProfileData: ({ user, actions, children, onClose }: {
    /** Запись пользователя. */ user: UserBotData;
    /** Действия карточки. */ actions: (context: ProfileTestContext) => ReactNode;
    /** Дополнительные разделы. */ children: (context: ProfileTestContext) => ReactNode;
    /** Закрытие карточки. */ onClose: () => void;
  }) => {
    const context = { user: { ...user, firstName: 'Актуальное имя', tokenId: 9 }, tokenId: 9 };
    return <aside aria-label="Общий профиль"><button onClick={onClose}>Закрыть профиль</button>{actions(context)}{children(context)}</aside>;
  },
}));

/** Контекст выбранного бота, передаваемый слотам общего профиля. */
interface ProfileTestContext {
  /** Актуальные сведения пользователя. */ user: UserBotData;
  /** Выбранный бот. */ tokenId: number;
}

afterEach(cleanup);

describe('Общий профиль во вкладке пользователей', () => {
  it('сохраняет дополнительные данные и открывает диалог с ботом из текущего профиля', () => {
    const onOpenDialog = vi.fn();
    const onClose = vi.fn();
    const user = { id: 'row-1', userId: '1195871907', firstName: 'Прежнее имя', tokenId: 6,
      userData: { answer: 'сохранённый ответ' }, botMemberships: [{ tokenId: 6 }, { tokenId: 9 }] } as UserBotData;
    render(<UserDetailsPanel projectId={10} selectedTokenId={null} user={user} onClose={onClose} onOpenDialog={onOpenDialog} />);
    expect(screen.getByRole('complementary', { name: 'Общий профиль' })).toBeTruthy();
    expect(screen.getByTestId('profile-extras').textContent).toContain('9:Актуальное имя');
    expect(screen.getByTestId('profile-extras').textContent).toContain('сохранённый ответ');
    fireEvent.click(screen.getByTestId('button-open-dialog-from-details'));
    expect(onOpenDialog).toHaveBeenCalledWith(expect.objectContaining({ userId: user.userId, tokenId: 9,
      firstName: 'Актуальное имя', userData: user.userData, botMemberships: user.botMemberships }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть профиль' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
