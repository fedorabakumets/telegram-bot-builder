/** @fileoverview Проверки сохранённой области и незавершённых ботов в истории. */
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CheckHistoryEntry } from '@shared/check-history';
import { CheckHistoryList } from './check-history-list';
import { CheckHistoryDetails } from './check-history-details';
afterEach(cleanup);
/** Снимок прошлого запуска с незавершённым ботом. */
const run: CheckHistoryEntry = {
  id: 'telegram-bots:1', projectId: 12, kind: 'telegram-bots', status: 'failed',
  createdAt: '2026-11-17T01:00:00.000Z', startedAt: '2026-11-17T01:00:00.000Z', finishedAt: '2026-11-17T01:01:00.000Z',
  scope: { mode: 'selected_bot', tokenId: 9, name: 'Прежнее имя', username: 'old_bot' }, failureReason: 'server_restarted',
  summary: { unit: 'bots', total: 1, processed: 0, available: 0, frozen: 0, invalidToken: 0, otherUnavailable: 0, errors: 0 },
};
/** Список обходится без полной загрузки участников и открывает запись по публичному ID. */
it('показывает снимок имени из компактного ответа и открывает детали', () => {
  const select = vi.fn();
  render(<CheckHistoryList items={[run]} onSelect={select} />);
  expect(screen.getByText(/Прежнее имя \(@old_bot\) #9 · Прервана · 1 мин 0 с/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  expect(select).toHaveBeenCalledWith('telegram-bots:1');
});
/** Перезапуск сервера не выдаётся за ошибку Telegram у ещё не проверенного бота. */
it('отделяет прерванную попытку от подтверждённого ответа Telegram', () => {
  render(<CheckHistoryDetails data={{ run, details: { items: [{ tokenId: 9, status: 'error', reason: 'error', name: 'Прежнее имя', finishedAt: null }] } }} />);
  expect(screen.getByText('Не проверен — проверка прервана')).toBeInTheDocument();
  expect(screen.getByText('Сервер перезапущен до завершения проверки')).toBeInTheDocument();
  expect(screen.getByText(/Проверено 0 из 1 ботов/)).toBeInTheDocument();
});
