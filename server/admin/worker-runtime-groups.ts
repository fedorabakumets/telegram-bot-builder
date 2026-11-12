/** @fileoverview Безопасная проекция фактических групп исполнителя для административного API. */
import type { RunnerSnapshot } from '../runner/runnerWorkers';
import type { WorkerRuntimeGroup } from '../../shared/worker-runtime-group';

/** Принимает только конечные неотрицательные счётчики. */
function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Не выдаёт внутренние PID, сборки, токены и окружение из inspect. */
export function workerRuntimeGroups(snapshot: RunnerSnapshot | null): WorkerRuntimeGroup[] | null {
  if (!snapshot || !Array.isArray(snapshot.workers)) return null;
  return snapshot.workers.slice(0, 1000).filter(item => item && Number.isFinite(item.workerKey)).map(item => {
    const execution = item.execution;
    const polling = execution?.polling;
    const active = !execution?.legacy ? count(polling?.activeChildren) : null;
    const registered = count(polling?.registeredBots);
    const maximum = polling?.maximum;
    const limited = typeof maximum === 'number' && Number.isSafeInteger(maximum) && maximum > 0;
    const reported = count(execution?.pythonMemoryKb);
    const hostStarted = (active ?? 0) > 0 || polling?.hostAlive === true;
    const python = reported === 0 && (execution?.legacy || hostStarted) ? null : reported;
    return { workerKey: item.workerKey,
      registeredBots: Array.isArray(item.tokenIds) ? item.tokenIds.length : 0,
      pendingBots: Array.isArray(item.pendingTokenIds) ? item.pendingTokenIds.length : 0,
      activeHandlers: active,
      activeHandlerLimit: limited ? maximum : null,
      activeHandlerLimitKnown: maximum === null || limited,
      sleepingBots: registered === null || active === null ? null : Math.max(0, registered - active),
      waitingBots: count(polling?.waitingBots), pythonRssBytes: python === null ? null : python * 1024,
      hostAlive: !execution?.legacy && typeof polling?.hostAlive === 'boolean' ? polling.hostAlive : null,
      handlerMode: polling?.handlerMode === 'shared' || polling?.handlerMode === 'isolated' ? polling.handlerMode : null };
  });
}
