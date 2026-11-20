/** @fileoverview Селектор ботов не подменяет состояние бота активностью пользователя. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
import type { UserBotMembership } from '@shared/user-bot-membership';
import { DialogHistoryBotSelect } from './dialog-history-bot-select';

afterEach(cleanup);

describe('состояние бота в селекторе ленты', () => {
  it('не показывает Неактивен из связи пользователя', () => {
    render(<DialogHistoryBotSelect tokens={[
      { id: 1, name: 'Первый', isActive: 1 }, { id: 2, name: 'Второй', isActive: 1 },
    ] as BotToken[]} memberships={[{ tokenId: 1, status: 'Неактивен' }] as UserBotMembership[]}
      historyTokenId={1} onHistoryTokenChange={vi.fn()} />);
    expect(screen.getByRole('combobox').textContent).toContain('Первый');
    expect(screen.queryByText('Неактивен')).toBeNull();
  });
  it('сохраняет подтверждённую заморозку самого бота', () => {
    render(<DialogHistoryBotSelect tokens={[
      { id: 1, name: 'Первый', isActive: 1, authorizationError: 'telegram_frozen' }, { id: 2, name: 'Второй', isActive: 1 },
    ] as BotToken[]} historyTokenId={1} onHistoryTokenChange={vi.fn()} />);
    expect(screen.getByRole('combobox').textContent).toContain('Бот заморожен Telegram');
  });
});
