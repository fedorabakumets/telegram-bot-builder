/**
 * @fileoverview Повторные попытки startBot при восстановлении после рестарта.
 * @module server/bots/restoreRetry
 */

import { clearBotRedisLock } from './clearBotRedisLock';

/** Паузы перед 2-й и 3-й попыткой (мс). Первая попытка без паузы. */
export const RESTORE_RETRY_DELAYS = [2000, 5000, 15000] as const;

/** Максимум попыток startBot при restore */
export const RESTORE_MAX_ATTEMPTS = 3;

export interface StartBotWithRetriesResult {
  success: boolean;
  error?: string;
  processId?: string;
  attempts: number;
}

export type StartBotFn = (
  projectId: number,
  token: string,
  tokenId: number,
  options?: { clearLogs?: boolean },
) => Promise<{ success: boolean; error?: string; processId?: string }>;

export type ClearLockFn = (
  token: string | null | undefined,
  tokenId?: number,
) => Promise<boolean>;

export interface StartBotWithRetriesDeps {
  startBotFn?: StartBotFn;
  clearLockFn?: ClearLockFn;
  waitFn?: (ms: number) => Promise<void>;
  maxAttempts?: number;
}

/**
 * Ждёт указанное число миллисекунд.
 * @param ms - Длительность паузы
 */
export function waitRestoreRetry(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Задержка перед попыткой `attempt` (1-based). Перед первой — 0.
 * @param attempt - Номер попытки (1..RESTORE_MAX_ATTEMPTS)
 * @returns мс паузы перед этой попыткой
 */
export function delayBeforeAttempt(attempt: number): number {
  if (attempt <= 1) return 0;
  const idx = attempt - 2;
  return RESTORE_RETRY_DELAYS[Math.min(idx, RESTORE_RETRY_DELAYS.length - 1)] ?? 0;
}

/**
 * Вызывает startBot с повторами при неудаче.
 * Перед каждой попыткой снимает Redis-lock.
 * startBot грузится динамически, чтобы unit-тесты не тянули БД.
 * @param projectId - ID проекта
 * @param token - Секрет токена Telegram
 * @param tokenId - ID токена
 * @param deps - Опциональные зависимости (для тестов)
 */
export async function startBotWithRetries(
  projectId: number,
  token: string,
  tokenId: number,
  deps: StartBotWithRetriesDeps = {},
): Promise<StartBotWithRetriesResult> {
  const start: StartBotFn = deps.startBotFn ?? (async (pid, tok, tid, opts) => {
    const { startBot } = await import('./startBot');
    return startBot(pid, tok, tid, opts);
  });
  const clearLock = deps.clearLockFn ?? clearBotRedisLock;
  const wait = deps.waitFn ?? waitRestoreRetry;
  const maxAttempts = deps.maxAttempts ?? RESTORE_MAX_ATTEMPTS;

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = delayBeforeAttempt(attempt);
    if (delay > 0) {
      console.log(
        `[Restore] token=${tokenId} попытка ${attempt}/${maxAttempts} через ${delay / 1000}с`,
      );
      await wait(delay);
    }

    await clearLock(token, tokenId);
    const result = await start(projectId, token, tokenId, { clearLogs: false });

    if (result.success) {
      return {
        success: true,
        processId: result.processId,
        attempts: attempt,
      };
    }

    lastError = result.error ?? 'Неизвестная ошибка startBot';
    console.error(
      `[Restore] token=${tokenId} попытка ${attempt}/${maxAttempts} не удалась: ${lastError}`,
    );
  }

  return {
    success: false,
    error: lastError ?? 'Ошибка при восстановлении после рестарта',
    attempts: maxAttempts,
  };
}
