/**
 * @fileoverview Контрольный проход: добить ботов, которые не поднялись после restore.
 * @module server/bots/restoreSweep
 */

import { storage } from '../storages/storage';
import { workerManager } from './botWorkerManager';
import { findActiveProcessForToken } from '../utils/findActiveProcessForToken';
import { clearBotRedisLock } from './clearBotRedisLock';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import { isExpectedStop } from './expectedStops';
import { isServerShuttingDown } from './serverShutdownState';
import { startBotWithRetries } from './restoreRetry';
import {
  selectSweepCandidates,
  SERVER_RESTART_MARKER,
  type SweepInstanceInput,
} from './restoreSweepSelect';
import { RESTORE_SWEEP_DELAY_MS } from './restoreSweepConstants';

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
  if (process.env.USE_WORKER_POOL !== 'false'
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
    let raised = 0;

    for (const inst of candidates) {
      if (isServerShuttingDown()) break;
      if (inst.tokenId == null) continue;
      if (isExpectedStop(inst.tokenId)) {
        console.log(`[RestoreSweep] Пропуск token=${inst.tokenId}: ожидаемый стоп`);
        continue;
      }

      const tokenRecord = await storage.getBotToken(inst.tokenId);
      const launchToken = tokenRecord?.token;
      if (!launchToken) {
        console.error(`[RestoreSweep] Нет токена token=${inst.tokenId}`);
        continue;
      }

      const inactiveError = refuseInactiveBotStart(tokenRecord.isActive);
      if (inactiveError) {
        console.log(`[RestoreSweep] Пропуск token=${inst.tokenId}: ${inactiveError}`);
        continue;
      }

      if (isBotActuallyRunning(inst.projectId, inst.tokenId)) {
        console.log(`[RestoreSweep] token=${inst.tokenId} уже жив — пропуск`);
        continue;
      }

      const reason = inst.errorMessage === SERVER_RESTART_MARKER
        ? 'маркер __server_restart__'
        : inst.status === 'running'
          ? 'числится running, но воркер пуст'
          : 'неудача основного restore';

      console.log(
        `[RestoreSweep] token=${inst.tokenId} ${reason} — поднимаю`,
      );

      await clearBotRedisLock(launchToken, inst.tokenId);
      const result = await startBotWithRetries(
        inst.projectId,
        launchToken,
        inst.tokenId,
      );

      if (result.success) {
        raised += 1;
        console.log(
          `[RestoreSweep] token=${inst.tokenId} поднят (попыток: ${result.attempts})`,
        );
      } else {
        console.error(
          `[RestoreSweep] token=${inst.tokenId} не поднялся: ${result.error}`,
        );
        await storage.updateBotInstance(inst.id, {
          status: 'error',
          errorMessage: result.error ?? 'Ошибка контрольного восстановления',
        });
      }
    }

    console.log(`[RestoreSweep] Готово: поднято ${raised} из ${candidates.length}`);
    return raised;
  } catch (err) {
    console.error('[RestoreSweep] Ошибка прохода:', err);
    return 0;
  }
}
