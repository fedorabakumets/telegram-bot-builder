/** @fileoverview Подготовка истории памяти с разрывами между отсутствующими замерами. */
import type { WorkerMetrics } from '@shared/worker-metrics';
/** Точка графика в МиБ. */
export interface WorkerChartPoint {
  /** Время снимка в миллисекундах. */
  time: number;
  /** RSS Node в МиБ либо разрыв. */
  node: number | null;
  /** RSS Python в МиБ либо разрыв. */
  python: number | null;
}
/** Не соединяет линии через пропуски опроса длительностью более 25 секунд. */
export function workerChartPoints(history: WorkerMetrics['history']): WorkerChartPoint[] {
  const result: WorkerChartPoint[] = [];
  for (const point of history) {
    const time = Date.parse(point.sampledAt);
    const previous = result.at(-1);
    if (!Number.isFinite(time)) continue;
    if (previous && time - previous.time > 25_000) result.push({ time: previous.time + 1, node: null, python: null });
    result.push({ time, node: point.nodeRssBytes === null ? null : point.nodeRssBytes / 1048576,
      python: point.pythonRssBytes === null ? null : point.pythonRssBytes / 1048576 });
  }
  return result;
}
