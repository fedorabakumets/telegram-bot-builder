/** @fileoverview Административная выборка лёгких счётчиков Python без настроек и содержимого ботов. */
import type { RunnerSnapshot } from '../runner/runnerWorkers';

/** Выделяет только диагностику; отсутствие исполнителя не подменяется нулевыми измерениями. */
export function selectWorkerRuntimeCounters(snapshot: RunnerSnapshot | null) {
  return {
    connected: snapshot !== null,
    workers: (snapshot?.workers ?? []).map(worker => ({
      workerKey: worker.workerKey,
      instance: worker.instance,
      pythonCounters: worker.pythonCounters ?? null,
    })),
  };
}
