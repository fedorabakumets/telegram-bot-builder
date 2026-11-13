/** @fileoverview Проверка независимого отображения Telegram-ограничения и состояния текущего процесса. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { BotLaunchHistory } from '@shared/schema';
import { BotLaunchCard } from './BotLaunchCard';

afterEach(cleanup);

/** Запись реального прошлого запуска остаётся неизменной при обновлении live-статуса. */
const record = { id: 1, status: 'running', startedAt: new Date(), stoppedAt: null, errorMessage: null } as BotLaunchHistory;

it('после остановки замороженного бота показывает остановленный процесс и отдельное ограничение', () => {
  const props = { record, onShowLogs: () => {}, featured: true, frozen: true };
  const view = render(<BotLaunchCard {...props} liveStatus="running" />);
  expect(screen.getByText('Процесс работает')).toBeTruthy();
  expect(screen.getByText('Заморожен в Telegram')).toBeTruthy();
  view.rerender(<BotLaunchCard {...props} liveStatus="stopping" />);
  expect(screen.getByText('Останавливается')).toBeTruthy();
  expect(screen.getByText(/Автоматическая остановка ещё не подтверждена/)).toBeTruthy();
  view.rerender(<BotLaunchCard {...props} liveStatus="stopped" />);
  expect(screen.getByText('Остановлен')).toBeTruthy();
  expect(screen.getByText(/Процесс остановлен/)).toBeTruthy();
  expect(screen.queryByText('Процесс работает')).toBeNull();
  expect(record.status).toBe('running');
});

it('потеря связи не выдаёт остановку, прошлые карточки сохраняют исторический статус', () => {
  const props = { record, onShowLogs: () => {}, featured: true };
  const view = render(<BotLaunchCard {...props} frozen liveStatus="unknown" />);
  expect(screen.getByText('Нет связи')).toBeTruthy();
  expect(screen.queryByText('Остановлен')).toBeNull();
  view.rerender(<BotLaunchCard {...props} />);
  expect(screen.getByText('Онлайн')).toBeTruthy();
  expect(screen.queryByText('Заморожен в Telegram')).toBeNull();
});
