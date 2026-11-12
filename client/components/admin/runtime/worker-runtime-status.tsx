/**
 * @fileoverview Живой монитор воркеров: связь, память, пробуждения и применение группировки.
 */
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import type { WorkerMetrics } from '@shared/worker-metrics';
import type { WorkerRuntimeGroup } from '@shared/worker-runtime-group';
import { WorkerGroupList } from './worker-group-list';
import { apiRequest } from '@/queryClient';
import { Button } from '@/components/ui/button';
import { RestartPendingWorkersButton } from './restart-pending-workers-button';
import { WorkerMonitorMetrics } from './worker-monitor-metrics';
import { workerGrouping } from './worker-monitor-format';
/** Безопасный снимок работающих воркеров. */
interface WorkerStatus {
  /** Сохранённая группировка. */
  grouping: string;
  /** Группировка работающих ботов. */
  activeGrouping: string | null;
  /** Среда запуска. */
  runtime: string;
  /** Количество групп. */
  workers: number;
  /** Количество зарегистрированных ботов. */
  bots: number;
  /** Боты прежней группировки. */
  pendingBots: number;
  /** Состояние соединения с исполнителем. */
  runnerConnected: boolean | null;
  /** Время проверки состояния. */
  checkedAt: string;
  /** Измерения исполнителя без секретов и пользовательских данных. */
  metrics?: WorkerMetrics;
  /** Подробные группы либо отсутствие снимка. */
  groups?: WorkerRuntimeGroup[] | null;
}
/** Показывает монитор отдельно от формы, чтобы обновления не стирали ввод администратора. */
export function WorkerRuntimeStatus() {
  const { data, isError, isPending, isFetching, refetch } = useQuery<WorkerStatus>({
    queryKey: ['/admin/api/runtime-settings/workers/status'],
    queryFn: () => apiRequest('GET', '/admin/api/runtime-settings/workers/status'),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  const sampled = data?.metrics?.sampledAt ?? data?.checkedAt;
  const stale = sampled ? Date.now() - Date.parse(sampled) > 30_000 : false;
  const connected = data?.runtime !== 'remote' ? 'Локальный исполнитель' : data.runnerConnected === true ? 'Исполнитель подключён' : data.runnerConnected === false ? 'Нет связи с исполнителем' : 'Связь не проверена';
  return <section aria-label="Монитор воркеров" className="min-w-0 rounded-lg border border-border bg-background p-4 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Монитор воркеров</h2>
        <p className="mt-1 text-xs text-muted-foreground">Обновление каждые 10 секунд{sampled ? ` · ${new Date(sampled).toLocaleTimeString('ru-RU')}` : ''}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} aria-label="Обновить состояние воркеров"><RefreshCw aria-hidden="true" />{isFetching ? 'Обновляем…' : 'Обновить'}</Button>
    </div>
    {isPending ? <div role="status" aria-label="Загрузка состояния" className="grid grid-cols-2 gap-4">{[0, 1, 2, 3].map(key => <div key={key} className="h-16 rounded-md bg-muted/40" />)}</div> : null}
    {isError ? <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">Не удалось обновить состояние. {data ? 'Ниже показан последний полученный снимок.' : 'Проверьте связь и нажмите «Обновить».'}</p> : null}
    {stale ? <p role="status" className="text-sm text-amber-300">Данные старше 30 секунд. Текущее состояние может отличаться.</p> : null}
    {data ? <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className={data.runnerConnected === false ? 'text-amber-300' : 'text-foreground'}>{connected}</span>
        <span className="text-muted-foreground">Групп <strong className="font-medium text-foreground tabular-nums">{data.workers}</strong></span>
        <span className="text-muted-foreground">Ботов включено <strong className="font-medium text-foreground tabular-nums">{data.bots}</strong></span>
      </div>
      <WorkerMonitorMetrics metrics={data.metrics} />
      <WorkerGroupList groups={data.groups} />
      <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">Настроено: {workerGrouping(data.grouping)} · Работает: {workerGrouping(data.activeGrouping)}</div>
      {data.pendingBots > 0 ? <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-700/40 p-3 text-sm text-amber-200"><span>Ботов с прежней группировкой: {data.pendingBots}</span><RestartPendingWorkersButton count={data.pendingBots} /></div> : null}
    </> : null}
  </section>;
}
