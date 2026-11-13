/** @fileoverview Раздельная активность Node polling и постоянных регистраций смешанной группы. */
/** Проверяет целочисленный неотрицательный счётчик. */
function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
/** Не скрывает известные Node-счётчики из-за соседнего постоянного Python. */
export function workerActivity(worker: Record<string, any>) {
  const execution = worker.execution;
  const polling = execution?.polling;
  const absent = execution != null && polling === null;
  const active = absent ? 0 : count(polling?.activeChildren);
  const registered = absent ? 0 : count(polling?.registeredBots);
  const waiting = absent ? 0 : count(polling?.waitingBots);
  const total = Array.isArray(worker.tokenIds) ? worker.tokenIds.length : null;
  return {
    activeHandlers: active,
    sleepingBots: registered === null || active === null || active > registered ? null : registered - active,
    waitingBots: waiting,
    permanentBots: total === null || registered === null || registered > total ? null : total - registered,
  };
}
