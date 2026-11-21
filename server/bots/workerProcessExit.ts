/** @fileoverview Сохраняет служебную причину аварии при последующем завершении канала воркера. */
import { isFrozenBotError } from './frozenBotStatus';
import { isRuntimeTokenUnauthorized } from './is-runtime-token-unauthorized';
import { parseWorkerHostCrash } from './workerBotDiagnostics';

/** Результат классификации одного выхода процесса без планирования повторов. */
export interface WorkerProcessExit {
  /** Штатная остановка либо ошибка, без числового NaN. */
  status: 'stopped' | 'error';
  /** Служебная причина или подтверждённая ошибка авторизации Telegram. */
  runtimeError?: string;
  /** Доверенный признак инфраструктурной аварии. */
  unexpected: boolean;
}

/**
 * Сохраняет диагностику общего процесса для бота, ещё не подтвердившего запуск.
 * @param code - Код процесса, отсутствие кода при сигнале или устаревший NaN.
 * @param signal - Сигнал ОС, не являющийся сам по себе доказательством OOM.
 * @param intentional - Остановка по команде менеджера.
 * @param hostCrash - Уже проверенная служебная причина общего обработчика.
 * @param botError - Подтверждённая причина отдельного бота.
 * @returns Данные одного события завершения.
 */
export function workerProcessExit(code: number | null, signal: string | null,
  intentional: boolean, hostCrash?: string, botError?: string): WorkerProcessExit {
  if (intentional) return { status: 'stopped', unexpected: false };
  const telegramFailure = isRuntimeTokenUnauthorized(botError) || isFrozenBotError(botError);
  if (telegramFailure) return { status: 'error', runtimeError: botError, unexpected: false };
  const normalizedCode = Number.isSafeInteger(code) ? code : null;
  if (normalizedCode === 0 && !signal && !hostCrash) return { status: 'stopped', unexpected: false };
  const reason = hostCrash ?? parseWorkerHostCrash({ type: 'worker_host_crash',
    exit_code: normalizedCode, signal });
  return { status: 'error', runtimeError: reason ?? botError, unexpected: true };
}
