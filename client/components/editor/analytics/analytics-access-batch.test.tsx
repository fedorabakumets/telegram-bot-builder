/** @fileoverview Выбор всех ботов и общий прогресс с отдельными результатами очередей. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AnalyticsAccessCheckButton } from './analytics-access-check-button';
import { AnalyticsAccessBatchProgress } from './analytics-access-batch-progress';
import type { BotToken } from '@shared/schema';
import type { ChatAccessBatch } from '@shared/chat-access-batch';
vi.mock('@/components/editor/database/user-database/components/check-history/check-history-content', () => ({
  CheckHistoryContent: ({ enabled }: { enabled: boolean }) => enabled ? <section>Прошлые проверки личных чатов</section> : null,
}));
/** Расписание тестируется отдельно от ручного запуска. */
vi.mock('@/components/editor/database/user-database/components/check-history/check-schedule-settings', () => ({ CheckScheduleSettings: () => null }));

afterEach(cleanup);
/** Общая область доступна сразу и не преобразуется в несуществующий числовой ID. */
it('позволяет выбрать всех ботов и подтвердить запуск', () => {
  const select = vi.fn(), confirm = vi.fn();
  render(<AnalyticsAccessCheckButton projectId={12} tokens={[{ id: 9, name: 'Первый' }, { id: 10, name: 'Второй' }] as BotToken[]}
    selectedTokenId="all" onSelectToken={select} totalUsers={12} onConfirm={confirm} />);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить личные чаты' }));
  expect(screen.getByRole('option', { name: 'Все боты проекта · 2' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Бот для проверки'), { target: { value: 'all' } });
  expect(select).toHaveBeenCalledWith('all');
  fireEvent.click(screen.getByRole('button', { name: 'Проверить' }));
  expect(confirm).toHaveBeenCalledOnce();
});
/** Отмена относится ко всем очередям, а не только к текущему выбранному боту. */
it('показывает общий прогресс и остановку всех очередей', () => {
  const cancel = vi.fn();
  const batch: ChatAccessBatch = { id: 1, projectId: 12, status: 'running', jobs: [9, 10].map(tokenId => ({
    jobId: tokenId, projectId: 12, tokenId, status: 'running', processedCount: 3, totalCount: 5,
    availableCount: 3, kickedCount: 0, deletedCount: 0, errorCount: 0, startedAt: null, finishedAt: null,
  })) };
  render(<AnalyticsAccessBatchProgress batch={batch} tokens={[]} cancelling={false} onCancel={cancel} />);
  expect(screen.getByText(/Личных чатов: 6 из 10/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Остановить все' }));
  expect(cancel).toHaveBeenCalledOnce();
});

/** Просмотр сохранённой истории не запускает проверку даже при пустой аудитории. */
it('показывает историю сразу в окне проверки без запуска', () => {
  const confirm = vi.fn();
  render(<AnalyticsAccessCheckButton projectId={12} tokens={[]} disabled selectedTokenId="all" onSelectToken={vi.fn()} totalUsers={0} onConfirm={confirm} />);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить личные чаты' }));
  expect(screen.getByText('Прошлые проверки личных чатов')).toBeInTheDocument();
  expect(confirm).not.toHaveBeenCalled();
});
