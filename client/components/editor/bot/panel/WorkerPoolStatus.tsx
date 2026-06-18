/**
 * @fileoverview Статус-бар Worker Pool — показывает количество воркеров, ботов и RAM
 * @module WorkerPoolStatus
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/queryClient';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectOptionLabel } from '@/components/editor/database/user-database/components/header/project-name-label';
import { formatMobileWorkerPoolSummary } from './worker-pool-summary';

/** Детализация одного воркера */
interface WorkerDetail {
  /** ID проекта */
  projectId: number;
  /** Количество ботов */
  botsCount: number;
  /** Потребление памяти в МБ */
  memoryMb: number;
  /** PID процесса */
  pid: number | undefined;
}

/** Ответ API /api/workers/stats */
interface WorkerStats {
  /** Количество активных воркеров */
  workers: number;
  /** Общее количество ботов во всех воркерах */
  totalBots: number;
  /** Общее потребление памяти в МБ */
  totalMemoryMb: number;
  /** Детализация по каждому воркеру */
  details: WorkerDetail[];
}

/** Пропсы компонента WorkerPoolStatus */
interface WorkerPoolStatusProps {
  /** Список проектов для отображения имён в детализации */
  projects?: Array<{ id: number; name: string }>;
}

/**
 * Возвращает имя проекта по ID
 * @param projectId - ID проекта
 * @param projects - Список проектов
 * @returns Имя проекта или нейтральный fallback
 */
function getProjectName(projectId: number, projects?: Array<{ id: number; name: string }>): string {
  return projects?.find(p => p.id === projectId)?.name ?? 'Проект';
}

/**
 * Детализация Worker Pool по проектам
 * @param props - Данные и список проектов
 * @returns JSX элемент
 */
function WorkerPoolDetails({ data, projects }: { data: WorkerStats; projects?: Array<{ id: number; name: string }> }) {
  return (
    <div className="space-y-2 text-xs">
      <div>
        <div className="font-medium">Worker Pool</div>
        <div className="mt-0.5 text-muted-foreground">
          {data.workers} воркер{data.workers > 1 ? 'а' : ''} · {data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}
          {data.totalMemoryMb > 0 && ` · ${data.totalMemoryMb} MB`}
        </div>
      </div>
      <div className="space-y-2 border-t border-border/50 pt-2">
        {data.details.map((d) => (
          <ProjectOptionLabel
            key={d.projectId}
            name={getProjectName(d.projectId, projects)}
            id={d.projectId}
            layout="detail"
            trailing={(
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {d.botsCount} бот · {d.memoryMb} MB
              </span>
            )}
          />
        ))}
      </div>
    </div>
  );
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

  const badgeBase = 'flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium';

  return (
    <>
      {/* Десктоп: hover-tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${badgeBase} cursor-default hidden sm:flex`}>
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
          <button type="button" className={`${badgeBase} sm:hidden max-w-[min(100%,200px)]`} aria-label="Статус Worker Pool">
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
