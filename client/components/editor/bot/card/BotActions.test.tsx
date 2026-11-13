/**
 * @fileoverview Проверки доступности остановки при запрете повторного запуска бота.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BotActions } from './BotActions';
afterEach(cleanup);
describe('управление ограниченным ботом', () => {
  it('позволяет остановить работающий процесс даже при блокировке запуска', () => {
    const stop = vi.fn();
    render(<BotActions isBotRunning startBlockedReason="Telegram ограничил бота"
      startBotMutation={{ isPending: false, mutate: vi.fn() }}
      stopBotMutation={{ isPending: false, mutate: stop }}
      onRequestDelete={vi.fn()} deletePending={false} onEditProfile={vi.fn()}
      isProfileLoading={false} tokenId={10} projectId={9} />);
    fireEvent.click(screen.getByRole('button', { name: 'Остановить бота' }));
    expect(stop).toHaveBeenCalledWith({ tokenId: 10, projectId: 9 });
  });
});
