/** @fileoverview Проверка единого источника чисел фильтра и строки доступности. */
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const { controls } = vi.hoisted(() => ({ controls: vi.fn() }));
vi.mock('./delete-without-private-button', () => ({ DeleteWithoutPrivateButton: () => <button>Удалить тех, кто без сообщений</button> }));
vi.mock('./user-directory-controls', () => ({ useDirectoryControls: controls }));
vi.mock('./users-telegram-bot-check-button', () => ({ UsersTelegramBotCheckButton: () => <button>Проверить ботов в Telegram</button> }));
vi.mock('./users-bot-availability-summary', () => ({ UsersBotAvailabilitySummary: () => <div>Ботов в проекте</div> }));
vi.mock('@/components/editor/analytics/analytics-access-check-panel', () => ({
  /** Не запускает реальные проверки в тесте сводки. */
  AnalyticsAccessCheckPanel: () => <button>Проверить доступность</button>,
}));
import { UsersAvailabilityCard } from './users-availability-card';
afterEach(cleanup);
describe('Сводка доступности пользователей', () => {
  it('показывает именно числа текущего фильтра, включая недоступность бота', () => {
    controls.mockReturnValue({ result: { statusCounts: { active: 923, blocked: 836, deleted: 60, botUnavailable: 6 } } });
    render(<UsersAvailabilityCard projectId={12} tokenId={null} />);
    for (const count of ['923', '836', '60', '6']) expect(screen.getByText(count)).toBeDefined();
    expect(screen.queryByText('818')).toBeNull();
    expect(screen.queryByText(/Проверено:/)).toBeNull();
  });
  it('не выдаёт неизвестные числа за нули и сохраняет настоящий ноль', () => {
    controls.mockReturnValue({ result: undefined });
    const view = render(<UsersAvailabilityCard projectId={12} tokenId={null} />);
    expect(screen.getAllByText('—')).toHaveLength(4);
    controls.mockReturnValue({ result: { statusCounts: { active: 0, blocked: 0, deleted: 0, botUnavailable: 0 } } });
    view.rerender(<UsersAvailabilityCard projectId={12} tokenId={null} />);
    expect(screen.getAllByText('0')).toHaveLength(4);
  });
});
