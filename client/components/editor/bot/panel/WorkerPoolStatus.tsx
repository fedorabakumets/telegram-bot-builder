/**
 * @fileoverview Статус-бар Worker Pool — показывает количество воркеров, ботов и RAM
 * @module WorkerPoolStatus
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/queryClient';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
 * На десктопе — tooltip по hover, на мобильных — popover по тапу с детализацией по проектам.
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

  const badgeBase = 'flex items-center gap-1 px-1.5 @[600px]:gap-1.5 @[600px]:px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium';

  return (
    <>
      {/* Десктоп: hover-tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${badgeBase} cursor-default hidden @[600px]:flex`}>
            <Activity className="w-3 h-3 shrink-0" />
            <span>{data.workers} воркер{data.workers > 1 ? 'а' : ''}</span>
            <span className="text-muted-foreground">·</span>
            <span>{data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}</span>
            {data.totalMemoryMb > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{data.totalMemoryMb} MB</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-xs">
          <WorkerPoolDetails data={data} projects={projects} />
        </TooltipContent>
      </Tooltip>

      {/* Мобильные: tap-popover с читаемой сводкой */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={`${badgeBase} @[600px]:hidden max-w-[min(100%,200px)]`} aria-label="Статус Worker Pool">
            <Activity className="w-3 h-3 shrink-0" />
            <span className="truncate tabular-nums">
              {formatMobileWorkerPoolSummary(data)}
            </span>
            <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-72 p-3">
          <WorkerPoolDetails data={data} projects={projects} />
        </PopoverContent>
      </Popover>
    </>
  );
}
