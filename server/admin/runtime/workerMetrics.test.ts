/** @fileoverview Проверки неизвестных замеров, нулевого RSS и безопасной ограниченной истории. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectWorkerMetrics } from './workerMetrics';

/** Создаёт снимок спящей группы без Python-процесса. */
function sleeping() {
  return { runtime: { nodeRssBytes: 100 }, workers: [{ execution: {
    legacy: null, pythonMemoryKb: 0,
    polling: { activeChildren: 0, registeredBots: 6, waitingBots: 0 },
  } }] };
}
describe('достоверность метрик воркеров', () => {
  it('показывает подтверждённый ноль Python, сохраняя память общего Node', async () => {
    const data = await collectWorkerMetrics(sleeping(), 'test');
    assert.equal(data.nodeRssBytes, 100);
    assert.equal(data.pythonRssBytes, 0);
    assert.equal(data.sleepingBots, 6);
    assert.equal(data.waitingBots, 0);
  });
  it('потеря связи не заменяет измерения нулём и не использует историю как свежий снимок', async () => {
    const data = await collectWorkerMetrics(null, 'test', { eval: async () => JSON.stringify([
      { sampledAt: '2026-11-12T10:00:00Z', nodeRssBytes: 100, pythonRssBytes: 0 },
    ]) });
    assert.equal(data.status, 'unavailable');
    assert.equal(data.sampledAt, null);
    assert.equal(data.pythonRssBytes, null);
    assert.equal(data.activeHandlers, null);
    assert.equal(data.history.length, 1);
  });
  it('не объявляет отсутствие схемы воркеров подтверждённым нулём', async () => {
    for (const workers of [undefined, {}, null]) {
      const data = await collectWorkerMetrics({ runtime: { nodeRssBytes: 100 }, workers }, 'test');
      assert.equal(data.pythonRssBytes, null);
      assert.equal(data.activeHandlers, null);
    }
  });
  it('не подменяет отсутствующие счётчики ожидания и регистраций нулём', async () => {
    const data = await collectWorkerMetrics({ runtime: { nodeRssBytes: 100 }, workers: [{ execution: {
      legacy: null, pythonMemoryKb: 0, polling: { activeChildren: 0 },
    } }] }, 'test');
    assert.equal(data.sleepingBots, null);
    assert.equal(data.waitingBots, null);
  });
  it('нулевой RSS живого Python считается отсутствием замера', async () => {
    const snapshot = sleeping();
    snapshot.workers[0].execution.polling.activeChildren = 1;
    const data = await collectWorkerMetrics(snapshot, 'test');
    assert.equal(data.pythonRssBytes, null);
  });
  it('выдаёт только разрешённые поля и ограничивает даже чужую историю', async () => {
    const secret = 'СЕКРЕТ_ТОКЕНА';
    const rows = Array.from({ length: 150 }, () => ({ sampledAt: '2026-11-12T10:00:00Z',
      nodeRssBytes: 100, pythonRssBytes: -10, env: secret, token: secret }));
    const data = await collectWorkerMetrics({ ...sleeping(), env: secret }, 'test', {
      eval: async () => JSON.stringify(rows),
    });
    assert.equal(data.history.length, 120);
    assert.equal(data.history[0].pythonRssBytes, null);
    assert.ok(!JSON.stringify(data).includes(secret));
  });
  it('недоступность Redis не скрывает свежий RSS', async () => {
    const data = await collectWorkerMetrics(sleeping(), 'test', { eval: async () => { throw new Error('секрет'); } });
    assert.equal(data.status, 'live');
    assert.deepEqual(data.history, []);
    assert.equal(data.nodeRssBytes, 100);
  });
});
