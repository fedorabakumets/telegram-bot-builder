/**
 * @fileoverview Состояние отдельного исполнителя и воркеров на странице настроек.
 */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { RestartPendingWorkersButton } from './restart-pending-workers-button';

/** Снимок работающих воркеров. */
interface WorkerStatus {
  /** Сохранённая группировка */
  grouping: string;
  /** Группировка работающих ботов */
  activeGrouping: string | null;
  /** Среда запуска */
  runtime: string;
  /** Количество процессов */
  workers: number;
  /** Количество запущенных ботов */
  bots: number;
  /** Суммарная физическая память в МиБ */
  memoryMb: number;
  /** Боты в воркерах прежней группировки */
  pendingBots: number;
  /** Связь с отдельным исполнителем */
  runnerConnected: boolean | null;
  /** Время проверки */
  checkedAt: string;
}

/** Показывает живые показатели отдельно от формы, чтобы опрос не стирал ввод. */
export function WorkerRuntimeStatus() {
  const { data, isError } = useQuery<WorkerStatus>({
    queryKey: ['/admin/api/runtime-settings/workers/status'],
    queryFn: () => apiRequest('GET', '/admin/api/runtime-settings/workers/status'),
    refetchInterval: 10_000,
  });
  return (
    <section aria-label="Состояние воркеров" className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div>
        <h2 className="font-medium">Сейчас работает</h2>
        <p className="text-xs text-muted-foreground">Проверено {data ? new Date(data.checkedAt).toLocaleTimeString('ru-RU') : '—'}</p>
      </div>
      {isError ? <p className="text-sm text-destructive">Не удалось получить состояние воркеров.</p> : null}
      {data ? <>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><span className="text-muted-foreground">Исполнитель</span><p>{data.runtime !== 'remote' ? 'Не требуется' : data.runnerConnected === null ? 'Неизвестно' : data.runnerConnected ? 'Подключён' : 'Нет связи'}</p></div>
          <div><span className="text-muted-foreground">Воркеры</span><p>{data.workers}</p></div>
          <div><span className="text-muted-foreground">Боты</span><p>{data.bots}</p></div>
          <div><span className="text-muted-foreground">Память</span><p>{data.memoryMb} MB</p></div>
        </div>
        <p className="text-xs text-muted-foreground">Настроено: {data.grouping} · Сейчас: {data.activeGrouping ?? 'нет запущенных ботов'}</p>
        {data.pendingBots > 0 ? <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          <span>{data.pendingBots} {data.pendingBots === 1 ? 'бот работает' : 'ботов работают'} в прежней группировке.</span>
          <RestartPendingWorkersButton count={data.pendingBots} />
        </div> : null}
      </> : null}
    </section>
  );
}
