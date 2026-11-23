/** @fileoverview Проверки открытия живого вывода текущего запуска и сохранённой истории. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BotLaunchHistory } from './BotLaunchHistory';

const mocks = vi.hoisted(() => ({
  status: 'running', stopping: false, add: vi.fn(), historyTab: vi.fn(), setTab: vi.fn(),
  active: vi.fn(),
  history: [{ id: 8970, status: 'running', startedAt: '2026-11-23T14:00:00Z' },
    { id: 8960, status: 'stopped', startedAt: '2026-11-22T14:00:00Z' }],
}));
vi.mock('../bot-control-context', () => ({ useBotControl: () => ({
  allBotStatuses: [{ tokenId: 8, status: mocks.status }],
  stopBotMutation: { isPending: mocks.stopping, variables: { tokenId: 8 } },
}) }));
vi.mock('../hooks/use-launch-history', () => ({ useLaunchHistory: () => ({ history: mocks.history, isLoading: false }) }));
vi.mock('../contexts/ActiveTerminalsContext', () => ({ useActiveTerminals: () => ({
  addTerminal: mocks.add, openHistoryTab: mocks.historyTab, setActiveTerminal: mocks.active,
}) }));
vi.mock('../canvas/bot-detail-tab-context', () => ({ useBotDetailTabOptional: () => ({ setTab: mocks.setTab }) }));
vi.mock('./BotLaunchCard', () => ({
  /** Сохраняет настоящий обработчик выбора, упрощая только визуальную карточку. */
  BotLaunchCard: ({ record, onShowLogs }: { record: { id: number; startedAt: string }; onShowLogs: (id: number, date: string) => void }) =>
    <button onClick={() => onShowLogs(record.id, record.startedAt)}>Логи {record.id}</button>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.status = 'running';
  mocks.stopping = false;
  mocks.history = [{ id: 8970, status: 'running', startedAt: '2026-11-23T14:00:00Z' },
    { id: 8960, status: 'stopped', startedAt: '2026-11-22T14:00:00Z' }];
});
afterEach(cleanup);

/** Открывает реальную панель истории с выбранным токеном проекта. */
function openPanel() {
  render(<BotLaunchHistory tokenId={8} projectId={12} botName="TorLink" isLiveRunning />);
}

describe('выбор вывода в истории запусков', () => {
  it.each(['running', 'stopping'])('текущий %s открывает живой терминал, а не снимок истории', (status) => {
    mocks.status = status;
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Логи 8970' }));
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ projectId: 12, tokenId: 8, botName: 'TorLink', isRunning: status === 'running' }));
    expect(mocks.historyTab).not.toHaveBeenCalled();
    expect(mocks.setTab).toHaveBeenCalledWith('terminal');
  });

  it('при работающем боте прошлый запуск остаётся отдельной историей', () => {
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Логи 8960' }));
    expect(mocks.historyTab).toHaveBeenCalledWith(expect.objectContaining({ launchId: 8960, projectId: 12, tokenId: 8 }));
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it.each(['stopped', 'unknown', 'error'])('состояние %s не подменяет сохранённый запуск живым', (status) => {
    mocks.status = status;
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Логи 8970' }));
    expect(mocks.historyTab).toHaveBeenCalledWith(expect.objectContaining({ launchId: 8970 }));
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it('онлайн со старой stopped-записью всё равно открывает живой вывод', () => {
    mocks.history[0].status = 'stopped';
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Логи 8970' }));
    expect(mocks.add).toHaveBeenCalledOnce();
    expect(mocks.historyTab).not.toHaveBeenCalled();
  });
});
