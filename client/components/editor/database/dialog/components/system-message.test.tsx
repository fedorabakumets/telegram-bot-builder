/**
 * @fileoverview Тест системных событий блокировки в ленте диалога
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SystemMessage } from './system-message';

describe('SystemMessage', () => {
  it('показывает блокировку пользователя как системное событие', () => {
    render(<SystemMessage text="Пользователь заблокировал бота"
      data={{ event: 'bot_blocked' }} createdAt="2026-10-14T10:00:00Z" />);
    expect(screen.getByText('Пользователь заблокировал бота')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-message-system-bot_blocked')).toBeInTheDocument();
  });

  it('показывает добавление и исключение бота в группе', () => {
    render(<SystemMessage text="Бота добавили в группу"
      data={{ event: 'bot_added_to_group' }} createdAt="2026-10-15T10:00:00Z" />);
    expect(screen.getByText('Бота добавили в группу')).toBeInTheDocument();
    render(<SystemMessage text="Бота исключили из группы"
      data={{ event: 'bot_removed_from_group' }} createdAt="2026-10-15T10:00:00Z" />);
    expect(screen.getByText('Бота исключили из группы')).toBeInTheDocument();
  });
  it('показывает разблокировку пользователя', () => {
    render(<SystemMessage text="Пользователь разблокировал бота"
      data={{ event: 'bot_unblocked' }} createdAt="2026-10-14T10:01:00Z" />);
    expect(screen.getByText('Пользователь разблокировал бота')).toBeInTheDocument();
  });
});
