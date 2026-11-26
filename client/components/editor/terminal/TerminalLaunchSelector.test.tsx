/** @fileoverview Проверки выбора живого и сохранённых запусков в селекторе терминала. */
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TerminalLaunchSelector } from './TerminalLaunchSelector';

const mocks = vi.hoisted(() => ({ history: [
  { id: 8970, status: 'running', startedAt: '2026-11-23T14:00:00Z' },
  { id: 8960, status: 'stopped', startedAt: '2026-11-22T14:00:00Z' },
], refetch: vi.fn(), more: vi.fn() }));
vi.mock('./use-terminal-launch-history', () => ({ useTerminalLaunchHistory: () => ({
  history: mocks.history, isLoading: false, isError: false, hasNextPage: false,
  isFetchingNextPage: false, fetchNextPage: mocks.more, refetch: mocks.refetch,
}) }));
vi.mock('@/components/ui/select', () => ({
  /** Нативный select сохраняет пользовательский выбор без порталов Radix. */
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) =>
    <select aria-label="Запуск" value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectItem: ({ value, children, disabled }: { value: string; children: ReactNode; disabled?: boolean }) =>
    <option value={value} disabled={disabled}>{children}</option>,
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.history = [{ id: 8970, status: 'running', startedAt: '2026-11-23T14:00:00Z' },
    { id: 8960, status: 'stopped', startedAt: '2026-11-22T14:00:00Z' }];
});
afterEach(cleanup);

/** Показывает селектор внутри явно выбранной вкладки истории. */
function openSelector(isRunning = true) {
  const onCurrent = vi.fn();
  const onHistory = vi.fn();
  /** Новый React-элемент гарантирует повторное чтение обновлённой истории при rerender. */
  const element = () => <TerminalLaunchSelector terminal={{ projectId: 12, tokenId: 8, botName: 'TorLink',
    isRunning, tabType: 'history', launchId: 8960 }} onCurrent={onCurrent} onHistory={onHistory} />;
  const view = render(element());
  return { onCurrent, onHistory, rerender: () => view.rerender(element()) };
}

describe('выбор запуска в терминале', () => {
  it('явный выбор текущего запуска возвращает живой поток', () => {
    const callbacks = openSelector();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'current' } });
    expect(callbacks.onCurrent).toHaveBeenCalledOnce();
    expect(callbacks.onHistory).not.toHaveBeenCalled();
  });
  it('выбор прошлого запуска сохраняет историю даже при работающем боте', () => {
    const callbacks = openSelector();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8960' } });
    expect(callbacks.onHistory).toHaveBeenCalledWith(8960, '2026-11-22T14:00:00Z');
    expect(callbacks.onCurrent).not.toHaveBeenCalled();
  });
  it('у остановленного бота running-запись из старой истории не становится живой', () => {
    const callbacks = openSelector(false);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8970' } });
    expect(callbacks.onHistory).toHaveBeenCalledWith(8970, '2026-11-23T14:00:00Z');
    expect(callbacks.onCurrent).not.toHaveBeenCalled();
  });
  it('числовой выбор running-записи явно открывает её историю', () => {
    const callbacks = openSelector();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8970' } });
    expect(callbacks.onHistory).toHaveBeenCalledWith(8970, '2026-11-23T14:00:00Z');
    expect(callbacks.onCurrent).not.toHaveBeenCalled();
  });
  it('открытая история не переключается сама при появлении нового запуска', () => {
    const callbacks = openSelector();
    mocks.history = [{ id: 8980, status: 'running', startedAt: '2026-11-23T15:00:00Z' },
      ...mocks.history.map(record => ({ ...record, status: 'stopped' }))];
    callbacks.rerender();
    expect(screen.getByRole('combobox')).toHaveValue('8960');
    expect(callbacks.onCurrent).not.toHaveBeenCalled();
    expect(callbacks.onHistory).not.toHaveBeenCalled();
  });
});
