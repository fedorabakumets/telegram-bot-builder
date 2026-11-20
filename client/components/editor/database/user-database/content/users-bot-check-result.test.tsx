/** @fileoverview Прогресс окна проверки самих ботов с постепенной заменой ожидания результатом. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { UsersBotCheckResult } from './users-bot-check-result';
import type { BotToken } from '@shared/schema';
/** Расписание тестируется отдельно от ручного запуска. */
vi.mock('@/components/editor/database/user-database/components/check-history/check-schedule-settings', () => ({ CheckScheduleSettings: () => null }));

afterEach(cleanup);
/** Окно видно до первого ответа, затем показывает каждый результат без раскрытия токенов. */
it('обновляет прогресс и строки в уже открытом окне', () => {
  const tokens = [{ id: 9, name: 'Первый', token: 'secret' }, { id: 10, name: 'Второй', token: 'secret' }] as BotToken[];
  const { rerender } = render(<UsersBotCheckResult open onOpenChange={vi.fn()} pending total={2} tokens={tokens}
    result={{ items: [], available: 0, unavailable: 0, errors: 0 }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Проверено 0 из 2');
  expect(screen.getAllByText('Ожидает результата…')).toHaveLength(2);
  rerender(<UsersBotCheckResult open onOpenChange={vi.fn()} pending total={2} tokens={tokens}
    result={{ items: [{ tokenId: 9, status: 'unavailable', reason: 'telegram_frozen' }], available: 0, unavailable: 1, errors: 0 }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Проверено 1 из 2');
  expect(screen.getByText('Бот заморожен Telegram')).toHaveStyle({ color: '#ef4444' });
  expect(screen.getAllByText('Ожидает результата…')).toHaveLength(1);
  expect(document.body.innerHTML).not.toContain('secret');
});

/** Тайм-аут объясняется как неопределённость, а не подтверждённая блокировка. */
it('поясняет исчерпание повторных попыток и этап проверки', () => {
  render(<UsersBotCheckResult open onOpenChange={vi.fn()} result={{ available: 0, unavailable: 0, errors: 1,
    items: [{ tokenId: 10, status: 'error', reason: 'timeout', method: 'getMe' }] }} />);
  expect(screen.getByText('Нет ответа Telegram после двух попыток по 15 секунд')).toBeInTheDocument();
  expect(screen.getByText('Этап: проверка токена')).toBeInTheDocument();
  expect(screen.getByText(/Сбой проверки не означает блокировку/)).toBeInTheDocument();
});
