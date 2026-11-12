/** @fileoverview Ограниченные числовые агрегаты задержек без сообщений и идентификаторов ботов. */
import type { MetricDistribution } from '../../../shared/worker-metrics';
/** Максимальное число замеров каждого вида за последние пятнадцать минут. */
const samples: Record<string, Array<{ at: number; ms: number }>> = { startupMs: [], handlingMs: [] };
/** Учитывает только разрешённые этапы, игнорируя остальные поля события. */
export function observePollingTiming(stage: string, values: Record<string, number>, now = Date.now()): void {
  const key = stage === 'child_ready' ? 'startupMs' : stage === 'handled' ? 'handlingMs' : null;
  const ms = key === 'startupMs' ? values.startupMs : values.receiveToHandledMs;
  if (!key || !Number.isFinite(ms) || ms < 0 || ms > 3_600_000) return;
  samples[key].push({ at: now, ms });
  if (samples[key].length > 120) samples[key].shift();
}
/** Возвращает статистику ограниченного временного окна без необработанных событий. */
export function pollingTimingMetrics(now = Date.now()): { startupMs: MetricDistribution | null; handlingMs: MetricDistribution | null } {
  /** Обрезает устаревшие значения и рассчитывает ближайший ранг процентиля. */
  const distribution = (key: string): MetricDistribution | null => {
    samples[key] = samples[key].filter(item => item.at >= now - 900_000 && item.at <= now);
    const values = samples[key].map(item => item.ms).sort((a, b) => a - b);
    if (!values.length) return null;
    return { count: values.length, p50Ms: values[Math.ceil(values.length * .5) - 1],
      p95Ms: values[Math.ceil(values.length * .95) - 1], lastMs: samples[key].at(-1)!.ms };
  };
  return { startupMs: distribution('startupMs'), handlingMs: distribution('handlingMs') };
}
