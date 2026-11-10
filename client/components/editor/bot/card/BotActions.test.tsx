/**
 * @fileoverview Проверки доступности управления ботом с отклонённым токеном.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BotActions } from './BotActions';

afterEach(cleanup);

/**
 * Создаёт свойства управления без реальных обращений к API.
 * @param running - Работает ли процесс
 * @returns Свойства и наблюдаемые обработчики запуска и остановки
 */
function props(running: boolean) {
  return {
    isBotRunning: running, startBlockedReason: 'Замените недействительный токен из @BotFather',
    startBotMutation: { isPending: false, mutate: vi.fn() },
    stopBotMutation: { isPending: false, mutate: vi.fn() },
    onRequestDelete: vi.fn(), deletePending: false, onEditProfile: vi.fn(),
    isProfileLoading: false, tokenId: 7, projectId: 1,
  };
}

describe('действия с недействительным токеном', () => {
  it('не отправляет заведомо неуспешный запрос запуска', () => {
    const data = props(false);
    render(<BotActions {...data} />);
    const button = screen.getByRole('button', { name: 'Запустить бота' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', data.startBlockedReason);
    fireEvent.click(button);
    expect(data.startBotMutation.mutate).not.toHaveBeenCalled();
  });
  it('сохраняет остановку уже работающего процесса', () => {
    const data = props(true);
    render(<BotActions {...data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Остановить бота' }));
    expect(data.stopBotMutation.mutate).toHaveBeenCalledWith({ tokenId: 7, projectId: 1 });
  });
});
