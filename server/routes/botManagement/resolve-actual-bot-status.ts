/**
 * @fileoverview Проверка фактической работы бота у локального или удалённого исполнителя.
 */

import { getProjectPlacement } from '../../bots/botPlacement';
import { RemoteRunnerHub } from '../../bots/remoteRunnerHub';
import { resolveRunnerRedisUrl } from '../../bots/resolveRunnerRedisUrl';
import { isBotStarting } from '../../bots/botStartState';
import { computeLiveBotStatus, type LiveBotInstanceRef } from './compute-live-bot-status';
import type { RunnerSnapshot } from '../../runner/runnerWorkers';

/** Возможные публичные состояния бота. */
export type ActualBotStatus = 'requested' | 'starting' | 'running' | 'stopped' | 'error' | 'unknown';

/** Кэш одного запроса для проверки каждого исполнителя только один раз. */
export type RunnerInspectionCache = Map<string, Promise<RunnerSnapshot>>;

/**
 * Сверяет состояние с исполнителем без предположений о PID другого контейнера.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param instance - Запись экземпляра из базы данных
 * @param spawnHeuristics - Разрешён ли поиск локального процесса
 * @param inspectionCache - Общий кэш снимков исполнителей для списка токенов
 * @returns Подтверждённое состояние или unknown при недоступности исполнителя
 */
export async function resolveActualBotStatus(
  projectId: number,
  tokenId: number,
  instance: (LiveBotInstanceRef & { status?: string; desiredStatus?: string | null }) | null | undefined,
  spawnHeuristics = false,
  inspectionCache?: RunnerInspectionCache,
): Promise<ActualBotStatus> {
  const placement = getProjectPlacement(projectId);
  if (placement.runnerId) {
    try {
      const hub = await RemoteRunnerHub.get(placement.runnerId, resolveRunnerRedisUrl());
      const snapshotPromise = inspectionCache?.get(placement.runnerId) ?? hub.inspect(1500);
      inspectionCache?.set(placement.runnerId, snapshotPromise);
      const snapshot = await snapshotPromise;
      if (snapshot.workers.some((worker) => worker.tokenIds.includes(tokenId))) return 'running';
      if (snapshot.workers.some((worker) => worker.pendingTokenIds.includes(tokenId))) return 'starting';
    } catch {
      return 'unknown';
    }
  } else if (computeLiveBotStatus(projectId, tokenId, instance, spawnHeuristics) === 'running') {
    return 'running';
  }
  if (isBotStarting(tokenId)) return 'starting';
  if (instance?.status === 'error') return 'error';
  if (placement.runnerId && instance?.desiredStatus === 'running') return 'requested';
  if (instance?.status === 'requested' || instance?.status === 'starting') return instance.status;
  return 'stopped';
}
