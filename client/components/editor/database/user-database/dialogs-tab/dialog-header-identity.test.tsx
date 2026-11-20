/** @fileoverview Регрессии выбора состояния конкретного бота в общей личной переписке. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserBotData } from '@/types/bot';
import { DialogHeaderIdentity } from './dialog-header-identity';

vi.mock('@/hooks/use-project-tokens', () => ({ useProjectTokens: () => [{ tokens: [] }] }));
vi.mock('../hooks/use-group-access', () => ({ useGroupAccess: () => ({ data: undefined, check: vi.fn(), botAvailability: null }) }));
vi.mock('../../dialog/components/user-avatar', () => ({ UserAvatar: () => null }));
vi.mock('./dialog-history-bot-select', () => ({ DialogHistoryBotSelect: () => null }));
vi.mock('./group-access-status', () => ({
  /** Показывает проверяемое состояние без порталов подсказки. */
  GroupAccessStatus: ({ status, botAvailability }: { /** Состояние чата. */ status?: string; /** Проблема бота. */ botAvailability?: string }) =>
    <span data-testid="access">{botAvailability || status || ''}</span>,
}));

afterEach(cleanup);

/** Создаёт человека с разными состояниями в двух ботах. */
function user(): UserBotData {
  return { userId: '123', firstName: 'Человек', isBlocked: true, botMemberships: [
    { tokenId: 1, isBlocked: true, status: 'Пользователь заблокировал бота' },
    { tokenId: 2, isBlocked: false, status: 'Активен' },
  ] } as UserBotData;
}

describe('Состояние выбранного бота в общей ленте', () => {
  it('не переносит блокировку представительной строки на доступного отправителя', () => {
    render(<DialogHeaderIdentity user={user()} projectId={10} tokenId={1} historyTokenId={null} replyTokenId={2} />);
    expect(screen.queryByText('Активен')).toBeNull();
    expect(screen.getByTestId('access').textContent).toBe('');
  });
  it('при смене отправителя показывает его блокировку', () => {
    const view = render(<DialogHeaderIdentity user={user()} projectId={10} historyTokenId={null} replyTokenId={2} />);
    view.rerender(<DialogHeaderIdentity user={user()} projectId={10} historyTokenId={null} replyTokenId={1} />);
    expect(screen.getByTestId('access').textContent).toBe('kicked');
    expect(screen.queryByText('Активен')).toBeNull();
  });
  it('не выдаёт сохранённую неактивность пользователя за состояние бота', () => {
    const person = user();
    person.botMemberships![1].status = 'Неактивен';
    render(<DialogHeaderIdentity user={person} projectId={10} historyTokenId={null} replyTokenId={2} />);
    expect(screen.queryByText('Неактивен')).toBeNull();
    expect(screen.getByTestId('access').textContent).toBe('');
  });
});
