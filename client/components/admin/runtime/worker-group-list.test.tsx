/** @fileoverview Проверки действующего лимита без предположений о версии исполнителя. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { WorkerRuntimeGroup } from '@shared/worker-runtime-group';
import { WorkerGroupList } from './worker-group-list';

/** Создаёт общий обработчик с достоверно измеренной политикой. */
function group(limit: number | null, known = true): WorkerRuntimeGroup {
  return { workerKey: 0, registeredBots: 100, pendingBots: 0, activeHandlers: 100,
    sleepingBots: 0, waitingBots: 0, pythonRssBytes: 1024, hostAlive: true,
    handlerMode: 'shared', activeHandlerLimit: limit, activeHandlerLimitKnown: known };
}

afterEach(cleanup);
describe('политика активных сценариев группы', () => {
  it('разделяет спящий process и постоянных ботов смешанной группы', () => {
    render(<WorkerGroupList groups={[{ ...group(null), registeredBots: 38,
      activeHandlers: 0, sleepingBots: 34, permanentBots: 4, hostAlive: false }]} />);
    expect(screen.getByText('0 / 34')).toBeTruthy();
    expect(screen.getByText('Постоянных ботов: 4')).toBeTruthy();
    expect(screen.getByText('Обработчик process спит')).toBeTruthy();
  });
  it('показывает отсутствие фиксированного лимита только по фактическому снимку', () => {
    render(<WorkerGroupList groups={[group(null)]} />);
    expect(screen.getByText('Без фиксированного лимита загруженных сценариев')).toBeTruthy();
  });
  it('не приписывает старому общему обработчику новую политику', () => {
    render(<WorkerGroupList groups={[group(null, false)]} />);
    expect(screen.getByText('Лимит обработчиков не измерен')).toBeTruthy();
    expect(screen.queryByText('Без фиксированного лимита загруженных сценариев')).toBeNull();
  });
  it('сохраняет отображение числового лимита прежнего исполнителя', () => {
    render(<WorkerGroupList groups={[group(4)]} />);
    expect(screen.getByText('Лимит активных обработчиков: 4')).toBeTruthy();
  });
});
