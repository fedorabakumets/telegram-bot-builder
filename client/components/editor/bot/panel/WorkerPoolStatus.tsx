/**
 * @fileoverview Статус-бар Worker Pool — показывает количество воркеров и ботов
 * @module WorkerPoolStatus
 */

import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

/** Ответ API /api/workers/stats */
interface WorkerStats {
  /** Количество активных воркеров */
  workers: number;
  /** Общее количество ботов во всех воркерах */
  totalBots: number;
}

/**
 * Компактный индикатор состояния Worker Pool
 * Показывает количество активных воркеров и ботов
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
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
      <Activity className="w-3 h-3" />
      <span>{data.workers} воркер{data.workers > 1 ? 'а' : ''}</span>
      <span className="text-muted-foreground">·</span>
      <span>{data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}</span>
    </div>
  );
}
