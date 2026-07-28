/**
 * @fileoverview Заголовок проекта в панели ботов
 * @module ProjectHeader
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronsDownUp, ChevronsUpDown, Play, RefreshCw } from 'lucide-react';
import { IdBadge } from '@/components/editor/database/user-database/components/header/project-name-label';
import {
  startOfflineProgressQueryKey,
  type StartOfflineProgressCache,
} from '../start-offline-progress-query';
import { StartOfflineConfirmDialog } from './StartOfflineConfirmDialog';

/** Свойства заголовка проекта */
interface ProjectHeaderProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Количество ботов */
  botsCount: number;
  /** Свернуть все */
  onCollapseAll?: () => void;
  /** Развернуть все */
  onExpandAll?: () => void;
  /** Все свёрнуты */
  allCollapsed?: boolean;
  /** Перезапуск running */
  onRestartAll?: () => void;
  /** Идёт перезапуск */
  isRestartingAll?: boolean;
  /** Число офлайн-ботов */
  offlineCount?: number;
  /** Запуск офлайн */
  onStartOfflineAll?: () => void;
  /** Идёт массовый старт офлайн */
  isStartingOffline?: boolean;
}

/**
 * Заголовок проекта со счётчиком и bulk-действиями
 * @param props - Свойства
 * @returns JSX
 */
export function ProjectHeader({
  projectId,
  projectName,
  botsCount,
  onCollapseAll,
  onExpandAll,
  allCollapsed,
  onRestartAll,
  isRestartingAll,
  offlineCount = 0,
  onStartOfflineAll,
  isStartingOffline,
}: ProjectHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: progress } = useQuery<StartOfflineProgressCache | undefined>({
    queryKey: startOfflineProgressQueryKey(projectId),
    queryFn: () => undefined,
    enabled: false,
    staleTime: Infinity,
  });

  const progressLabel =
    isStartingOffline && progress && progress.status === 'running' && progress.total > 0
      ? `${progress.started + progress.failed}/${progress.total}`
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="flex min-w-0 items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
        <span className="truncate">{projectName}</span>
        <IdBadge id={projectId} className="text-[11px]" />
      </h3>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          Ботов: {botsCount}
        </span>
        {botsCount > 0 && onCollapseAll && onExpandAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs text-muted-foreground"
            onClick={allCollapsed ? onExpandAll : onCollapseAll}
            aria-label={allCollapsed ? 'Развернуть все карточки' : 'Свернуть все карточки'}
          >
            {allCollapsed
              ? <><ChevronsUpDown className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Развернуть все</span></>
              : <><ChevronsDownUp className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Свернуть все</span></>
            }
          </Button>
        )}
        {botsCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs text-muted-foreground"
            onClick={onRestartAll}
            disabled={isRestartingAll || isStartingOffline}
            aria-label="Перезапустить всех запущенных ботов проекта"
          >
            <RefreshCw className={`w-3 h-3 sm:mr-1 ${isRestartingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRestartingAll ? 'Перезапуск...' : 'Перезапустить'}</span>
          </Button>
        )}
        {botsCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs text-muted-foreground"
            onClick={() => setConfirmOpen(true)}
            disabled={offlineCount === 0 || isStartingOffline || isRestartingAll}
            aria-label="Запустить офлайн-ботов проекта"
          >
            <Play className={`w-3 h-3 sm:mr-1 ${isStartingOffline ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {isStartingOffline
                ? (progressLabel ? `Запуск ${progressLabel}` : 'Запуск...')
                : offlineCount > 0
                  ? `Запустить офлайн (${offlineCount})`
                  : 'Запустить офлайн'}
            </span>
          </Button>
        )}
      </div>

      <StartOfflineConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        projectName={projectName}
        offlineCount={offlineCount}
        onConfirm={() => onStartOfflineAll?.()}
      />
    </div>
  );
}
