/**
 * @fileoverview Ожидание подтверждения старта бота из worker pool
 * @module server/bots/waitForWorkerBotStart
 */

import type { EventEmitter } from 'node:events';

/** Таймаут ожидания bot_started (мс). Крупные bot.py компилятся >30с */
export const WORKER_START_CONFIRM_TIMEOUT_MS = 120_000;

/**
 * Ждёт событие bot-started для конкретного tokenId или таймаут.
 * @param emitter - EventEmitter воркер-менеджера
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param timeoutMs - Таймаут ожидания
 * @returns true если воркер подтвердил старт
 */
export function waitForWorkerBotStart(
  emitter: EventEmitter,
  projectId: number,
  tokenId: number,
  timeoutMs: number = WORKER_START_CONFIRM_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      emitter.off('bot-started', onStart);
      clearTimeout(timer);
    };

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    const onStart = (pid: number, tid: number) => {
      if (pid === projectId && tid === tokenId) {
        finish(true);
      }
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    emitter.on('bot-started', onStart);
  });
}
