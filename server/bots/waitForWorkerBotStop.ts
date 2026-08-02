/**
 * @fileoverview Ожидание подтверждения остановки бота из worker pool
 * @module server/bots/waitForWorkerBotStop
 */

import type { EventEmitter } from 'node:events';

/** Таймаут ожидания bot_exited/bot_stopped (мс): graceful 15с + cancel 5с */
export const WORKER_STOP_CONFIRM_TIMEOUT_MS = 20_000;

/**
 * Ждёт событие bot-exited для конкретного tokenId или таймаут.
 * @param emitter - EventEmitter воркер-менеджера (bot-exited)
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param timeoutMs - Таймаут ожидания
 * @returns true если воркер подтвердил выход, false при таймауте
 */
export function waitForWorkerBotStop(
  emitter: EventEmitter,
  projectId: number,
  tokenId: number,
  timeoutMs: number = WORKER_STOP_CONFIRM_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      emitter.off('bot-exited', onExit);
      clearTimeout(timer);
    };

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    const onExit = (pid: number, tid: number, _status: string | number) => {
      if (pid === projectId && tid === tokenId) {
        finish(true);
      }
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    emitter.on('bot-exited', onExit);
  });
}
