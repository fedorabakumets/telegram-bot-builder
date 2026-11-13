/** @fileoverview Единый учёт физического Python без повторного сложения общей памяти. */
/** Принимает только конечный неотрицательный размер памяти. */
function memory(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
/** Разделяет физический общий процесс и активность временных сценариев. */
export function workerPythonMemory(execution: Record<string, any> | null | undefined) {
  const host = execution?.unifiedHost;
  const unified = execution?.execution === 'unified' && host?.shared === true;
  const polling = execution?.polling;
  const alive = unified ? typeof host.hostAlive === 'boolean' ? host.hostAlive
    : Boolean(host.pid || host.actualPid || host.permanentTokenIds?.length || host.activeHandlers)
    : typeof polling?.hostAlive === 'boolean' ? polling.hostAlive : null;
  const measured = memory(execution?.pythonMemoryKb);
  const live = unified ? alive : execution?.legacy || alive || polling?.activeChildren
    || polling?.sharedHost?.pid || polling?.sharedHost?.actualPid;
  return { pythonRssBytes: measured === null || (measured === 0 && live) ? null : measured * 1024,
    hostAlive: alive, unified };
}
