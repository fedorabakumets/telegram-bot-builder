/**
 * @fileoverview Статус-бар Worker Pool — показывает количество воркеров, ботов и RAM
 * @module WorkerPoolStatus
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/queryClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMobileWorkerPoolSummary } from './worker-pool-summary';
import { WorkerPoolDetails, type WorkerStats } from './worker-pool-details';

/** Пропсы компонента WorkerPoolStatus */
interface WorkerPoolStatusProps {
  /** Список проектов для отображения имён в детализации */
  projects?: Array<{ id: number; name: string }>;
}

/**
 * Компактный индикатор состояния Worker Pool.
 * Детализация по проектам открывается нажатием на индикатор на любом экране.
 * @param props - Свойства компонента
 * @returns JSX элемент или null если воркеров нет
 */
export function WorkerPoolStatus({ projects }: WorkerPoolStatusProps) {
  const { data } = useQuery<WorkerStats>({
    queryKey: ['/api/workers/stats'],
    queryFn: () => apiRequest('GET', '/api/workers/stats'),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  if (!data || data.workers === 0) return null;

  /** При недоступности исполнителя сохранённые счётчики не подтверждают онлайн. */
  const disconnected = data.connectionVerified === false;
  const badgeBase = `flex items-center gap-1 px-1.5 @[600px]:gap-1.5 @[600px]:px-2 py-1 rounded-md text-xs font-medium ${disconnected ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`;

  return (
    <>
      {/* На тесной панели детали сводки доступны через иконку. */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Статус Worker Pool" title="Сводка воркеров" className={`${badgeBase} hidden @[600px]:flex h-8 w-8 @[700px]:w-auto justify-center shrink-0 whitespace-nowrap [&>span]:hidden @[700px]:[&>span]:inline hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 data-[state=open]:bg-emerald-500/20`}>
            <Activity className="w-3 h-3 shrink-0" />
            <span>{disconnected ? 'Нет связи' : `${data.workers} воркер${data.workers > 1 ? 'а' : ''}`}</span>
            <span className="text-muted-foreground">·</span>
            <span>{data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}</span>
            {data.totalMemoryMb > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{data.totalMemoryMb} MB</span>
              </>
            )}
            <ChevronDown className="hidden @[700px]:block w-3 h-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 p-3">
          <WorkerPoolDetails data={data} projects={projects} />
        </PopoverContent>
      </Popover>

      {/* Мобильные: tap-popover с читаемой сводкой */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={`${badgeBase} @[600px]:hidden max-w-[min(100%,200px)] sm:h-8 sm:w-8 sm:shrink-0 sm:justify-center`} aria-label="Статус Worker Pool" title="Сводка воркеров">
            <Activity className="w-3 h-3 shrink-0" />
            <span className="truncate tabular-nums sm:hidden">
              {disconnected ? 'Нет связи с исполнителем' : formatMobileWorkerPoolSummary(data)}
            </span>
            <ChevronDown className="w-3 h-3 shrink-0 opacity-60 sm:hidden" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-72 p-3">
          <WorkerPoolDetails data={data} projects={projects} />
        </PopoverContent>
      </Popover>
    </>
  );
}
