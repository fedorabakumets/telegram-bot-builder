/**
 * @fileoverview Live-статус бота: worker pool и in-memory процесс, без секретов
 * @module botManagement/compute-live-bot-status
 */

import { checkProcessExists, isPythonProcess } from './utils/processChecker';
import { restoreProcessTracking } from './utils/processRestorer';
import { findActiveProcessForToken } from '../../utils/findActiveProcessForToken';
import { workerManager } from '../../bots/botWorkerManager';

/** Поля экземпляра, нужные для live-статуса */
export interface LiveBotInstanceRef {
  /** PID или worker_<projectId> */
  processId?: string | null;
}

/**
 * Сверяет, запущен ли бот сейчас (воркер или дочерний процесс).
 * PID-эвристики spawn — только по флагу: в bulk они дороги и ложны для мультитокена.
 *
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param instance - Экземпляр из БД или null
 * @param spawnHeuristics - Искать «живой» spawn-PID, если воркер не подтвердил
 * @returns running или stopped
 */
export function computeLiveBotStatus(
  projectId: number,
  tokenId: number,
  instance: LiveBotInstanceRef | null | undefined,
  spawnHeuristics = false,
): 'running' | 'stopped' {
  const hasChild = Boolean(findActiveProcessForToken(projectId, tokenId));
  const inWorker =
    process.env.USE_WORKER_POOL !== 'false' && workerManager.isBotRunning(projectId, tokenId);
  if (hasChild || inWorker) return 'running';
  if (!instance) return 'stopped';

  const isWorkerPid =
    typeof instance.processId === 'string' && instance.processId.startsWith('worker_');
  if (isWorkerPid || !spawnHeuristics || !instance.processId) return 'stopped';

  if (checkProcessExists(instance.processId)) {
    restoreProcessTracking(projectId, tokenId, Number.parseInt(instance.processId, 10));
    return 'running';
  }
  if (isPythonProcess(instance.processId)) {
    restoreProcessTracking(projectId, tokenId, Number.parseInt(instance.processId, 10));
    return 'running';
  }
  return 'stopped';
}
