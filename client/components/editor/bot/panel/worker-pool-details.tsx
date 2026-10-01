/**
 * @fileoverview Детализация Worker Pool по проектам и типы ответа /api/workers/stats
 * @module bot/panel/worker-pool-details
 */

import { ProjectOptionLabel } from '@/components/editor/database/user-database/components/header/project-name-label';

/** Детализация одного воркера */
export interface WorkerDetail {
  /** ID проекта */
  projectId: number;
  /** Количество ботов */
  botsCount: number;
  /** Потребление памяти в МБ */
  memoryMb: number;
  /** PID процесса */
  pid: number | undefined;
  /** true, если воркер общий для нескольких проектов — memoryMb это доля проекта */
  shared?: boolean;
}

/** Ответ API /api/workers/stats */
export interface WorkerStats {
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
export function WorkerPoolDetails({ data, projects }: { data: WorkerStats; projects?: Array<{ id: number; name: string }> }) {
  return (
    <div className="space-y-2 text-xs">
      <div>
        <div className="font-medium">Worker Pool</div>
        <div className="mt-0.5 text-muted-foreground">
          {data.workers} воркер{data.workers > 1 ? 'а' : ''} · {data.totalBots} бот{data.totalBots > 1 ? 'а' : ''}
          {data.totalMemoryMb > 0 && ` · ${data.totalMemoryMb} MB`}
        </div>
        {data.details.some((d) => d.shared) && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Общий воркер: память поделена между проектами по числу ботов
          </div>
        )}
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
                {d.botsCount} бот · {d.shared ? '≈' : ''}{d.memoryMb} MB
              </span>
            )}
          />
        ))}
      </div>
    </div>
  );
}
