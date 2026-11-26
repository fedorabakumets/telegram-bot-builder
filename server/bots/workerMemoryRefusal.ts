/** @fileoverview Различает отказ вместимости исполнителя и аварию Python-процесса. */
export const MEMORY_REFUSAL_PREFIX = '[runner_memory] ';
/** Понятная причина без секретов и произвольного текста транспорта. */
export const MEMORY_REFUSAL_REASON = `${MEMORY_REFUSAL_PREFIX}Недостаточно свободной памяти исполнителя для безопасного запуска нового бота`;

/**
 * Проверяет служебный источник и соответствие текущему запуску.
 * @param event - Структурированное сообщение исполнителя.
 * @param launchId - Текущий запуск; при наличии обязателен точный идентификатор.
 * @returns Подтверждён ли отказ допуска текущего запуска.
 */
export function isWorkerMemoryRefusal(event: { source?: unknown; code?: unknown; launch_id?: unknown }, launchId?: number): boolean {
  return event.source === 'runner_memory' && event.code === 'memory_pressure'
    && (launchId === undefined || event.launch_id === launchId);
}

/** Распознаёт отказ для отдельной очереди ожидания памяти вместо аварийных автоповторов. */
export function isMemoryRefusalReason(reason?: string): boolean {
  return reason?.includes(MEMORY_REFUSAL_PREFIX) === true;
}
