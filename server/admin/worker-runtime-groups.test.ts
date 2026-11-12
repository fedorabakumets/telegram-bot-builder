/** @fileoverview Проверки безопасного списка групп старого и нового исполнителя. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RunnerSnapshot } from '../runner/runnerWorkers';
import { workerRuntimeGroups } from './worker-runtime-groups';

/** Передаёт недоверенный inspect в проекцию без обращения к инфраструктуре. */
function project(workers: unknown) {
  return workerRuntimeGroups({ workers } as RunnerSnapshot);
}
describe('проекция групп воркеров', () => {
  it('старый исполнитель без расширенной телеметрии не показывает фиктивный ноль RSS', () => {
    const data = project([{ workerKey: 0, tokenIds: [30, 31], pendingTokenIds: [] }])!;
    assert.equal(data[0].registeredBots, 2);
    assert.equal(data[0].activeHandlers, null);
    assert.equal(data[0].pythonRssBytes, null);
    assert.equal(data[0].handlerMode, null);
    assert.equal(data[0].activeHandlerLimitKnown, false);
  });
  it('сохраняет подтверждённый ноль спящей общей группы и не раскрывает её секреты', () => {
    const secret = 'СКРЫТЫЙ_ТОКЕН';
    const data = project([{ workerKey: 0, tokenIds: [30, 31], pendingTokenIds: [], token: secret,
      execution: { pythonMemoryKb: 0, legacy: null, pid: 123, env: secret,
        polling: { activeChildren: 0, registeredBots: 2, waitingBots: 0, hostAlive: false, handlerMode: 'shared', maximum: null } },
    }])!;
    assert.equal(data[0].pythonRssBytes, 0);
    assert.equal(data[0].sleepingBots, 2);
    assert.equal(data[0].hostAlive, false);
    assert.equal(data[0].handlerMode, 'shared');
    assert.equal(data[0].activeHandlerLimit, null);
    assert.equal(data[0].activeHandlerLimitKnown, true);
    assert.ok(!JSON.stringify(data).includes(secret));
    assert.ok(!JSON.stringify(data).includes('pid'));
  });
  it('некорректные элементы снимка не ломают административный API', () => {
    assert.equal(project(null), null);
    assert.deepEqual(project([null, 1, 'ошибка', {}, { workerKey: Infinity }]), []);
  });
  it('живой обработчик без ненулевого замера не выдаёт нулевую память', () => {
    const data = project([{ workerKey: 0, tokenIds: [30], pendingTokenIds: [], execution: {
      pythonMemoryKb: 0, legacy: null,
      polling: { activeChildren: 1, registeredBots: 1, waitingBots: 0, hostAlive: true },
    } }])!;
    assert.equal(data[0].pythonRssBytes, null);
  });
  it('показывает измеренный лимит и не объявляет старый shared безлимитным', () => {
    const rows = project([4, undefined, NaN, -1, 1.5].map((maximum, workerKey) => ({
      workerKey, tokenIds: [], pendingTokenIds: [], execution: {
        polling: { handlerMode: 'shared', maximum },
      },
    })))!;
    assert.equal(rows[0].activeHandlerLimit, 4);
    assert.equal(rows[0].activeHandlerLimitKnown, true);
    for (const row of rows.slice(1)) {
      assert.equal(row.activeHandlerLimit, null);
      assert.equal(row.activeHandlerLimitKnown, false);
    }
  });
});
