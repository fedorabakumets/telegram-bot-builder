/**
 * @fileoverview Контрольный проход: добить ботов, которые не поднялись после restore.
 * @module server/bots/restoreSweep
 */

import { storage } from '../storages/storage';
import { workerManager } from './botWorkerManager';
import { isWorkerPoolEnabled } from './isWorkerPoolEnabled';
import { findActiveProcessForToken } from '../utils/findActiveProcessForToken';
import { isServerShuttingDown } from './serverShutdownState';
import {
  selectSweepCandidates,
  SERVER_RESTART_MARKER,
  type SweepInstanceInput,
} from './restoreSweepSelect';
import { RESTORE_SWEEP_DELAY_MS } from './restoreSweepConstants';
import { runRestoreProjects, mapRestoreCandidates } from './restoreGrouping';
import { restoreSweepCandidate } from './restoreSweepCandidate';

export {
  selectSweepCandidates,
  SERVER_RESTART_MARKER,
  type SweepInstanceInput,
} from './restoreSweepSelect';
export { RESTORE_SWEEP_DELAY_MS } from './restoreSweepConstants';

/**
 * Проверяет, запущен ли бот в worker pool или spawn-режиме.
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 */
export function isBotActuallyRunning(projectId: number, tokenId: number): boolean {
  if (isWorkerPoolEnabled()
    && workerManager.isBotRunning(projectId, tokenId)) {
    return true;
  }
  return !!findActiveProcessForToken(projectId, tokenId);
}

/**
 * Одноразовый контрольный проход через RESTORE_SWEEP_DELAY_MS.
 * @param failedTokenIds - Токены, не поднявшиеся в основном restore
 */
export function scheduleRestoreSweep(failedTokenIds: number[] = []): void {
  const failed = new Set(failedTokenIds);
  console.log(
    `[RestoreSweep] Запланирован через ${RESTORE_SWEEP_DELAY_MS / 1000}с`
    + (failed.size ? ` (failed: ${[...failed].join(',')})` : ''),
  );

  setTimeout(() => {
    void runRestoreSweep(failed);
  }, RESTORE_SWEEP_DELAY_MS);
}

/**
 * Выполняет контрольный проход немедленно (для тестов / ручного вызова).
 * @param failedTokenIds - Множество токенов из основного restore
 */
export async function runRestoreSweep(
  failedTokenIds: ReadonlySet<number> = new Set(),
): Promise<number> {
  if (isServerShuttingDown()) {
    console.log('[RestoreSweep] Пропуск: сервер гасится');
    return 0;
  }

  try {
    const allInstances = await storage.getAllBotInstances();
    const enriched: SweepInstanceInput[] = [];

    for (const inst of allInstances) {
      if (inst.tokenId == null) continue;
      if (inst.desiredStatus === 'stopped') continue;
      const token = await storage.getBotToken(inst.tokenId);
      enriched.push({
        id: inst.id,
        projectId: inst.projectId,
        tokenId: inst.tokenId,
        status: inst.status,
        errorMessage: inst.errorMessage,
        isActive: token?.isActive ?? null,
      });
    }

    const candidates = selectSweepCandidates(
      enriched,
      (tokenId) => {
        const row = enriched.find((e) => e.tokenId === tokenId);
        if (!row) return false;
        return isBotActuallyRunning(row.projectId, tokenId);
      },
      failedTokenIds,
    );

    if (candidates.length === 0) {
      console.log('[RestoreSweep] Кандидатов нет — всё ок');
      return 0;
    }

    console.log(`[RestoreSweep] Кандидатов: ${candidates.length}`);
    // В группе не более пяти попыток; общий startBot ограничивает все проекты вместе.
    const counts = await runRestoreProjects(candidates, async group => {
      const results = await mapRestoreCandidates(group, async instance =>
        isServerShuttingDown() ? 0 : restoreSweepCandidate(instance, isBotActuallyRunning));
      return results.reduce((sum, count) => sum + count, 0);
    });
    const raised = counts.reduce((sum, count) => sum + count, 0);

    console.log(`[RestoreSweep] Готово: поднято ${raised} из ${candidates.length}`);
    return raised;
  } catch (err) {
    console.error('[RestoreSweep] Ошибка прохода:', err);
    return 0;
  }
}
