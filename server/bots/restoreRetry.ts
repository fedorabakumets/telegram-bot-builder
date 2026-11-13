/**
 * @fileoverview Повторные попытки startBot при восстановлении после рестарта.
 * @module server/bots/restoreRetry
 */
import { BOT_LOCK_BUSY_ERROR } from './waitForBotRedisLock';
import { BOT_START_CANCELLED_ERROR, getBotStartRevision } from './botStartState';

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
  options?: { clearLogs?: boolean; reuseGeneratedCode?: boolean; waitForExistingLock?: boolean },
) => Promise<{ success: boolean; error?: string; processId?: string }>;

export interface StartBotWithRetriesDeps {
  /** Функция запуска для повторных попыток. */
  startBotFn?: StartBotFn;
  /** Ожидание перед следующей попыткой. */
  waitFn?: (ms: number) => Promise<void>;
  /** Предельное количество попыток. */
  maxAttempts?: number;
  /** Повторная проверка автоматического запуска после задержки каждой попытки. */
  canStart?: () => Promise<boolean>;
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
 * Не снимает Redis-lock: он может принадлежать другому работающему экземпляру.
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
  const wait = deps.waitFn ?? waitRestoreRetry;
  const maxAttempts = deps.maxAttempts ?? RESTORE_MAX_ATTEMPTS;
  const revision = getBotStartRevision(tokenId);


  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = delayBeforeAttempt(attempt);
    if (delay > 0) {
      console.log(
        `[Restore] token=${tokenId} попытка ${attempt}/${maxAttempts} через ${delay / 1000}с`,
      );
      await wait(delay);
    }

    const allowed = !deps.canStart || await deps.canStart();
    if (getBotStartRevision(tokenId) !== revision || !allowed) {
      return { success: false, error: BOT_START_CANCELLED_ERROR, attempts: attempt - 1 };
    }
    const result = await start(projectId, token, tokenId, {
      clearLogs: false,
      reuseGeneratedCode: true,
      waitForExistingLock: true,
    });

    if (result.success) {
      return {
        success: true,
        processId: result.processId,
        attempts: attempt,
      };
    }

    lastError = result.error ?? 'Неизвестная ошибка startBot';
    if (lastError === BOT_LOCK_BUSY_ERROR || lastError === BOT_START_CANCELLED_ERROR) {
      return { success: false, error: lastError, attempts: attempt };
    }
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
