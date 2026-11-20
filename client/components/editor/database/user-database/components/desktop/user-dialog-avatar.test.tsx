/** @fileoverview Проверяет привязку фотографии к боту строки и переход к диалогу. */
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserBotData } from '@shared/schema';
vi.mock('../../../dialog/components/user-avatar', () => ({
  /** Показывает выбранного бота вместо сетевой загрузки изображения. */
  UserAvatar: ({ tokenId }: { /** Выбранный бот. */ tokenId?: number }) => <span data-testid="avatar-token">{tokenId}</span>,
}));
import { UserDialogAvatar } from './user-dialog-avatar';
afterEach(cleanup);
describe('Бот аватара пользователя', () => {
  it('выбирает бота каждой строки в режиме всех ботов и обновляет его без смены пользователя', () => {
    const user = { userId: '123', firstName: 'Иван', tokenId: 9 } as UserBotData;
    const open = vi.fn();
    const { rerender } = render(<UserDialogAvatar user={user} tokenId={null} onOpenDialog={open} />);
    expect(screen.getByTestId('avatar-token').textContent).toBe('9');
    fireEvent.click(screen.getByRole('button', { name: 'Открыть диалог по аватару: Иван' }));
    expect(open).toHaveBeenCalledOnce();
    rerender(<UserDialogAvatar user={{ ...user, tokenId: 11 }} tokenId={null} />);
    expect(screen.getByTestId('avatar-token').textContent).toBe('11');
  });
  it('сохраняет явно выбранного бота', () => {
    render(<UserDialogAvatar user={{ userId: '123', tokenId: 9 } as UserBotData} tokenId={11} />);
    expect(screen.getByTestId('avatar-token').textContent).toBe('11');
  });
});
