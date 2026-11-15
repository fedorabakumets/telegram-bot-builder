/** @fileoverview Разделение подтверждённой аварии общего обработчика и ошибок отдельного бота. */
import { formatBotRuntimeError } from './formatBotRuntimeError';
import { isWorkerCleanExit } from './isWorkerCleanExit';

/** Сохранённая причина инфраструктурного сбоя для восстановления желаемого состояния. */
export const HOST_CRASH_PREFIX = '[worker_host_crash] ';

/**
 * Принимает причину общего сбоя только вместе с доверенным признаком смерти процесса.
 * @param runtimeError - Причина, переданная менеджером воркера.
 * @param processDeathUnexpected - Подтверждённая менеджером неожиданная смерть процесса.
 * @returns Является ли причина инфраструктурным сбоем, а не произвольным stderr.
 */
export function isInfrastructureHostCrash(runtimeError: string | undefined, processDeathUnexpected: boolean): boolean {
  return processDeathUnexpected && Boolean(runtimeError?.startsWith(HOST_CRASH_PREFIX));
}

/**
 * Описывает завершение работающего бота, сохраняя доверенную причину общего сбоя.
 * @param exitStatus - Код или статус завершения.
 * @param runtimeError - Последняя подтверждённая ошибка либо причина смерти общего процесса.
 * @param processDeathUnexpected - Доверенный признак неожиданной смерти процесса.
 * @returns Сообщение истории и экземпляра либо null при штатной остановке.
 */
export function resolveWorkerExitError(
  exitStatus: string | number, runtimeError?: string, processDeathUnexpected = false,
): string | null {
  if (String(exitStatus) !== 'error' && isWorkerCleanExit(exitStatus)
      && !(String(exitStatus) === 'null' && isInfrastructureHostCrash(runtimeError, processDeathUnexpected))) return null;
  if (isInfrastructureHostCrash(runtimeError, processDeathUnexpected)) return runtimeError!;
  if (runtimeError) return formatBotRuntimeError(runtimeError).replace(/^Ошибка запуска:\s*/, 'Ошибка выполнения: ');
  return String(exitStatus) === 'error' ? 'Бот завершился с ошибкой' : `Бот завершился: ${exitStatus}`;
}
