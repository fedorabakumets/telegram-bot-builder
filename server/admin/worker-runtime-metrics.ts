/** @fileoverview Получение безопасных фактических метрик удалённого исполнителя без новых соединений. */
import type { RunnerSnapshot } from '../runner/runnerWorkers';
import { RemoteRunnerHub } from '../bots/remoteRunnerHub';
import { resolveRunnerRedisUrl } from '../bots/resolveRunnerRedisUrl';
import { getWorkerRunnerId, getWorkerRuntime } from '../bots/workerRuntime';
import { getRedisPublisher } from '../redis/redisClient';
import { collectWorkerMetrics } from './runtime/workerMetrics';
import { workerRuntimeGroups } from './worker-runtime-groups';
import { WorkerInspectionCache } from './worker-inspection-cache';

/** Короткий кеш не позволяет вкладкам создавать параллельный поток inspect-команд. */
const inspections = new WorkerInspectionCache<RunnerSnapshot>();

/** Возвращает коротко кешированный снимок для метрик и таблицы ботов через существующий Redis. */
export async function getWorkerInspectionSnapshot(): Promise<RunnerSnapshot | null> {
  const runnerId = getWorkerRunnerId();
  let snapshot: RunnerSnapshot | null = null;
  if (getWorkerRuntime() === 'remote') try {
    const url = resolveRunnerRedisUrl();
    snapshot = await inspections.read(`${runnerId}\0${url}`, async () => {
      const hub = await RemoteRunnerHub.get(runnerId, url);
      return hub.inspect(2_500);
    });
  } catch { /* Ошибка конфигурации или связи не должна раскрывать адрес Redis. */ }
  return snapshot;
}

/** Читает живой исполнитель, сохраняя неизвестные значения при отсутствии ответа. */
export async function getWorkerRuntimeMetrics() {
  const runnerId = getWorkerRunnerId();
  const snapshot = await getWorkerInspectionSnapshot();
  const metrics = await collectWorkerMetrics(snapshot, runnerId, getRedisPublisher());
  return { metrics, groups: workerRuntimeGroups(snapshot) };
}
