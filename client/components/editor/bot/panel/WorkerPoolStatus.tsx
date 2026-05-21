/**
 * @fileoverview Статус-бар Worker Pool — показывает количество воркеров, ботов и RAM
 * @module WorkerPoolStatus
 */

import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { apiRequest } from '@/queryClient';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

/**
 * Компактный индикатор состояния Worker Pool с tooltip деталями
 * @returns JSX элемент или null если воркеров нет
 */
export function WorkerPoolStatus() {
  const { data } = useQuery<WorkerStats>({
    queryKey: ['/api/workers/stats'],
    queryFn: () => apiRequest('GET', '/api/workers/stats'),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  if (!data || data.workers === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium cursor-default">
          <Activity className="w-3 h-3" />
          {/* Мобильная версия: только число ботов */}
          <span className="sm:hidden tabular-nums">{data.totalBots}</span>
          {/* Десктопная версия: полная информация */}
          <span className="hidden sm:inline">{data.workers} воркер{data.workers > 1 ? 'а' : ''}</span>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <span className="hidden sm:inline">{data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}</span>
          {data.totalMemoryMb > 0 && (
            <>
              <span className="hidden sm:inline text-muted-foreground">·</span>
              <span className="hidden sm:inline">{data.totalMemoryMb} MB</span>
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <div className="font-medium mb-1">Worker Pool</div>
          {data.details.map((d) => (
            <div key={d.projectId} className="flex justify-between gap-4">
              <span>Проект {d.projectId}</span>
              <span className="text-muted-foreground">{d.botsCount} бот · {d.memoryMb} MB</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
