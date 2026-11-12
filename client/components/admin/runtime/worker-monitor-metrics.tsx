/** @fileoverview Память, активность и длительности с явными границами измерений. */
import type { WorkerMetrics } from '@shared/worker-metrics';
import { WorkerMemoryChart } from './worker-memory-chart';
import { workerDuration, workerMemory } from './worker-monitor-format';
/** Входные измерения исполнителя. */
interface Props {
  /** Снимок, отсутствующий до первой успешной проверки. */
  metrics: WorkerMetrics | null | undefined;
}
/** Показывает последний RSS и измеренные задержки без искусственного деления памяти на ботов. */
export function WorkerMonitorMetrics({ metrics }: Props) {
  if (!metrics) return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Подробные замеры ещё не получены. Обновите состояние после подключения исполнителя.</p>;
  const memory = (value: number | null) => workerMemory(value === null ? null : value / 1048576);
  return <div className="space-y-4">
    {metrics.status === 'unavailable' ? <p role="status" className="text-sm text-amber-300">Исполнитель не передал свежий снимок. Показана сохранённая история.</p> : null}
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div><dt className="text-xs text-muted-foreground">Node · RSS</dt><dd className="mt-1 text-lg font-medium tabular-nums">{memory(metrics.nodeRssBytes)}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Python · RSS</dt><dd className="mt-1 text-lg font-medium tabular-nums">{memory(metrics.pythonRssBytes)}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Обработчиков активно</dt><dd className="mt-1 text-lg font-medium tabular-nums">{metrics.activeHandlers ?? '—'}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Ботов спит</dt><dd className="mt-1 text-lg font-medium tabular-nums">{metrics.sleepingBots ?? '—'}</dd><p className="mt-1 text-xs text-muted-foreground">Из них ждут слот: {metrics.waitingBots ?? '—'}</p></div>
    </dl>
    <WorkerMemoryChart history={metrics.history} />
    <div className="grid gap-3 sm:grid-cols-2">
      {([{ title: 'Пробуждение сценария', value: metrics.latency.startupMs }, { title: 'Получение → завершение', value: metrics.latency.handlingMs }]).map(item => <div key={item.title} className="rounded-md border border-border p-3">
        <h3 className="text-sm font-medium">{item.title}</h3>
        {item.value ? <><p className="mt-2 text-sm tabular-nums">Последнее {workerDuration(item.value.lastMs)} · p95 {workerDuration(item.value.p95Ms)}</p><p className="mt-1 text-xs text-muted-foreground">Медиана {workerDuration(item.value.p50Ms)} · замеров {item.value.count}</p></> : <p className="mt-2 text-sm text-muted-foreground">Нет замеров: дождитесь обращения к боту.</p>}
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">Пробуждение включает загрузку сценария. Время получения и обработки не включает доставку сообщения от клиента Telegram до исполнителя.</p>
  </div>;
}
