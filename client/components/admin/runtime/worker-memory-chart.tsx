/** @fileoverview График реальных замеров Node и Python с разрывами при отсутствии данных. */
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WorkerMetrics } from '@shared/worker-metrics';
import { workerMemory } from './worker-monitor-format';
import { workerChartPoints } from './worker-chart-points';
/** Параметры графика памяти. */
interface Props {
  /** Ограниченная история снимков исполнителя. */
  history: WorkerMetrics['history'];
}
/** Показывает только полученные снимки и не соединяет пропуски данных. */
export function WorkerMemoryChart({ history }: Props) {
  const points = workerChartPoints(history);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-medium">Память процессов</h3>
      <div className="flex gap-4 text-xs text-muted-foreground" aria-label="Легенда графика">
        <span><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Node</span>
        <span><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Python</span>
      </div>
    </div>
    {points.length < 2 ? <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Истории пока недостаточно. График появится после двух успешных замеров.</div> :
      <div role="img" aria-label="История памяти Node и Python в МиБ" className="h-40 min-w-0">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="time" tickFormatter={value => new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} minTickGap={48} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis width={40} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
          <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleTimeString('ru-RU')} formatter={(value, name) => [workerMemory(typeof value === 'number' ? value : null), name === 'node' ? 'Node' : 'Python']} contentStyle={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 8 }} />
          <Line dataKey="node" stroke="#34d399" strokeWidth={2} dot={points.length < 4} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="python" stroke="#fbbf24" strokeWidth={2} dot={points.length < 4} connectNulls={false} isAnimationActive={false} />
        </LineChart></ResponsiveContainer>
      </div>}
    <p className="text-xs text-muted-foreground">МиБ · RSS процессов. Память контейнера и его файловый кеш здесь не измеряются. История собирается при открытой странице; пропуски не заменяются нулём.</p>
  </div>;
}
